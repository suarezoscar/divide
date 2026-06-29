import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  query,
  where,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Group, Member } from "../types";

function docToGroup(id: string, data: DocumentData): Group {
  return {
    id,
    name: data.name,
    description: data.description ?? "",
    members: data.members ?? [],
    userIds: data.userIds ?? [data.createdBy],
    inviteCode: data.inviteCode,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
  };
}

export async function createGroup(
  userId: string,
  name: string,
  description: string,
  members: Member[]
): Promise<Group> {
  if (!members.length) throw new Error("El grupo debe tener al menos un miembro");
  const ref = await addDoc(collection(db, "groups"), {
    name,
    description,
    members,
    userIds: [userId],
    createdBy: userId,
    createdAt: Timestamp.now(),
  });
  return {
    id: ref.id,
    name,
    description,
    members,
    userIds: [userId],
    createdBy: userId,
    createdAt: Timestamp.now(),
  };
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  const q = query(
    collection(db, "groups"),
    where("userIds", "array-contains", userId)
  );
  const snap = await getDocs(q);
  const groups = snap.docs.map((d) => docToGroup(d.id, d.data()));
  return groups.toSorted((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, "groups", groupId));
  if (!snap.exists()) return null;
  return docToGroup(snap.id, snap.data());
}

export async function updateGroupMembers(groupId: string, members: Member[]): Promise<void> {
  await updateDoc(doc(db, "groups", groupId), { members });
}

export async function removeMemberFromGroup(groupId: string, memberId: string): Promise<void> {
  const snap = await getDoc(doc(db, "groups", groupId));
  const data = snap.data();
  if (!data) return;
  const members: Member[] = (data.members ?? []).filter((m: Member) => m.id !== memberId);
  const removedMember = (data.members ?? []).find((m: Member) => m.id === memberId);
  // If the removed member had a linked userId, remove it from userIds too
  const userIds: string[] = removedMember?.userId
    ? (data.userIds ?? []).filter((uid: string) => uid !== removedMember.userId)
    : (data.userIds ?? []);
  if (members.length === 0) {
    await updateDoc(doc(db, "groups", groupId), { members: [], userIds: [] });
  } else {
    await updateDoc(doc(db, "groups", groupId), { members, userIds });
  }
}

export async function leaveGroup(groupId: string, userId: string, memberId: string): Promise<void> {
  const snap = await getDoc(doc(db, "groups", groupId));
  const data = snap.data();
  if (!data) return;
  const members: Member[] = (data.members ?? []).filter((m: Member) => m.id !== memberId);
  const userIds: string[] = (data.userIds ?? []).filter((uid: string) => uid !== userId);
  await updateDoc(doc(db, "groups", groupId), { members, userIds });
}

export async function addUserToGroup(
  groupId: string,
  userId: string,
  memberNameOrId: string,
  claimExisting = false
): Promise<void> {
  if (claimExisting) {
    // Update existing member to link userId
    const snap = await getDoc(doc(db, "groups", groupId));
    const data = snap.data();
    if (!data) return;
    const members: Member[] = (data.members ?? []).map((m: Member) =>
      m.id === memberNameOrId ? { ...m, userId } : m
    );
    await updateDoc(doc(db, "groups", groupId), { members, userIds: arrayUnion(userId) });
  } else {
    const member: Member = { id: crypto.randomUUID(), name: memberNameOrId, userId };
    await updateDoc(doc(db, "groups", groupId), {
      userIds: arrayUnion(userId),
      members: arrayUnion(member),
    });
  }
}

export async function claimMember(
  groupId: string,
  memberId: string,
  userId: string
): Promise<void> {
  const snap = await getDoc(doc(db, "groups", groupId));
  const data = snap.data();
  if (!data) return;
  const members: Member[] = (data.members ?? []).map((m: Member) =>
    m.id === memberId ? { ...m, userId } : m
  );
  await updateDoc(doc(db, "groups", groupId), { members, userIds: arrayUnion(userId) });
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1

function randomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function generateInviteCode(groupId: string): Promise<string> {
  const snap = await getDoc(doc(db, "groups", groupId));
  const data = snap.data();
  if (data?.inviteCode) return data.inviteCode;
  const code = randomCode();
  await updateDoc(doc(db, "groups", groupId), { inviteCode: code });
  return code;
}

export async function getGroupByInviteCode(code: string): Promise<Group | null> {
  const q = query(
    collection(db, "groups"),
    where("inviteCode", "==", code.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return docToGroup(snap.docs[0].id, snap.docs[0].data());
}

export async function deleteGroup(groupId: string): Promise<void> {
  // 1. Delete all expenses for this group
  const expensesSnap = await getDocs(
    query(collection(db, "expenses"), where("groupId", "==", groupId))
  );
  const expenseDeletions = expensesSnap.docs.map((d) => deleteDoc(doc(db, "expenses", d.id)));

  // 2. Delete all settlements for this group
  const settlementsSnap = await getDocs(
    query(collection(db, "settlements"), where("groupId", "==", groupId))
  );
  const settlementDeletions = settlementsSnap.docs.map((d) => deleteDoc(doc(db, "settlements", d.id)));

  // 3. Wait for all deletions, then delete the group itself
  await Promise.all([...expenseDeletions, ...settlementDeletions]);
  await deleteDoc(doc(db, "groups", groupId));
}
