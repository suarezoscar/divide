import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./useAuth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import * as groupsService from "../services/groups";
import type { Group, Member } from "../types";

function docToGroup(id: string, data: Record<string, unknown>): Group {
  const d = data as Record<string, any>;
  return {
    id,
    name: d.name,
    description: d.description ?? "",
    members: d.members ?? [],
    userIds: d.userIds ?? [d.createdBy],
    inviteCode: d.inviteCode,
    createdBy: d.createdBy,
    createdAt: d.createdAt,
  };
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const q = query(collection(db, "groups"), where("userIds", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const result = snap.docs.map((d) => docToGroup(d.id, d.data()));
      setGroups(result.toSorted((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching groups:", err);
      setError("No se pudieron cargar los grupos. Revisa tu conexión o el adblocker.");
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const create = async (name: string, description: string, members: Member[]) => {
    if (!user) throw new Error("No has iniciado sesión");
    const g = await groupsService.createGroup(user.uid, name, description, members);
    setGroups((prev) => [g, ...prev]);
    return g;
  };

  return { groups, loading, error, create };
}

export function useGroup(groupId: string) {
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupsService.getGroup(groupId).then((g) => {
      setGroup(g);
    }).catch(() => {
      setLoading(false);
    });
  }, [groupId]);

  const linkedMemberId = useMemo(() => {
    if (!user || !group) return null;
    return group.members.find((m) => m.userId === user.uid)?.id ?? null;
  }, [group, user]);

  const updateMembers = async (members: Member[]) => {
    await groupsService.updateGroupMembers(groupId, members);
    setGroup((prev) => (prev ? { ...prev, members } : null));
  };

  const removeMember = async (memberId: string) => {
    await groupsService.removeMemberFromGroup(groupId, memberId);
    setGroup((prev) =>
      prev
        ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) }
        : null
    );
  };

  const removeGroup = async () => {
    await groupsService.deleteGroup(groupId);
  };

  const claimMember = async (memberId: string) => {
    if (!user) return;
    await groupsService.claimMember(groupId, memberId, user.uid);
    setGroup((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId ? { ...m, userId: user.uid } : m
        ),
        userIds: prev.userIds.includes(user.uid) ? prev.userIds : [...prev.userIds, user.uid],
      };
    });
  };

  return { group, loading, linkedMemberId, updateMembers, removeMember, removeGroup, claimMember };
}
