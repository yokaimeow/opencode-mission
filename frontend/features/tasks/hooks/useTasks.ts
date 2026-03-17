'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../api/taskApi';
import type { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority } from '../types';

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<Task | null>;
  updateTask: (id: string, data: UpdateTaskRequest) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
}

export function useTasks(projectId: string): UseTasksReturn {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskApi.listByProject(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskRequest) => taskApi.create(projectId, data),
    onSuccess: (newTask) => {
      queryClient.setQueryData<Task[]>(['tasks', projectId], (old) =>
        old ? [...old, newTask] : [newTask]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      taskApi.update(id, data),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(['tasks', projectId], (old) =>
        old ? old.map((t) => (t.id === updatedTask.id ? updatedTask : t)) : [updatedTask]
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Task[]>(['tasks', projectId], (old) =>
        old ? old.filter((t) => t.id !== deletedId) : []
      );
    },
  });

  const createTask = async (data: CreateTaskRequest): Promise<Task | null> => {
    try {
      return await createMutation.mutateAsync(data);
    } catch {
      return null;
    }
  };

  const updateTask = async (id: string, data: UpdateTaskRequest): Promise<Task | null> => {
    try {
      return await updateMutation.mutateAsync({ id, data });
    } catch {
      return null;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    tasks,
    isLoading,
    error: error?.message ?? null,
    refetch: async () => {
      await refetch();
    },
    createTask,
    updateTask,
    deleteTask,
  };
}

interface UseTaskReturn {
  task: Task | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateTask: (data: UpdateTaskRequest) => Promise<Task | null>;
  deleteTask: () => Promise<boolean>;
}

export function useTask(taskId: string): UseTaskReturn {
  const queryClient = useQueryClient();

  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskApi.get(taskId),
    enabled: !!taskId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTaskRequest) => taskApi.update(taskId, data),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task>(['task', taskId], updatedTask);
      queryClient.setQueryData<Task[]>(['tasks', updatedTask.project_id], (old) =>
        old ? old.map((t) => (t.id === updatedTask.id ? updatedTask : t)) : undefined
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => taskApi.delete(taskId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['task', taskId] });
    },
  });

  const updateTask = async (data: UpdateTaskRequest): Promise<Task | null> => {
    try {
      return await updateMutation.mutateAsync(data);
    } catch {
      return null;
    }
  };

  const deleteTask = async (): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  return {
    task,
    isLoading,
    error: error?.message ?? null,
    refetch: async () => {
      await refetch();
    },
    updateTask,
    deleteTask,
  };
}

export type { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority };

interface UseUserTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserTasks(): UseUserTasksReturn {
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['userTasks'],
    queryFn: () => taskApi.listByUser(),
  });

  return {
    tasks,
    isLoading,
    error: error?.message ?? null,
    refetch: async () => {
      await refetch();
    },
  };
}
