import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
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

export async function addUserToGroup(
  groupId: string,
  userId: string,
  memberName: string
): Promise<void> {
  const member: Member = { id: crypto.randomUUID(), name: memberName };
  await updateDoc(doc(db, "groups", groupId), {
    userIds: arrayUnion(userId),
    members: arrayUnion(member),
  });
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
