import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import * as groupsService from "../services/groups";
import type { Group, Member } from "../types";

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await groupsService.getUserGroups(user.uid);
      setGroups(result);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError("No se pudieron cargar los grupos. Revisa tu conexión o el adblocker.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const create = async (name: string, description: string, members: Member[]) => {
    if (!user) throw new Error("No has iniciado sesión");
    const g = await groupsService.createGroup(user.uid, name, description, members);
    setGroups((prev) => [g, ...prev]);
    return g;
  };

  return { groups, loading, error, create, refetch: fetchGroups };
}

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupsService.getGroup(groupId).then((g) => {
      setGroup(g);
    }).catch(() => {
      // Silently fail — caller handles null group
    }).finally(() => {
      setLoading(false);
    });
  }, [groupId]);

  const updateMembers = async (members: Member[]) => {
    await groupsService.updateGroupMembers(groupId, members);
    setGroup((prev) => (prev ? { ...prev, members } : null));
  };

  return { group, loading, updateMembers };
}
