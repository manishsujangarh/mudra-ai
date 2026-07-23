import { useMutation } from '@tanstack/react-query';
import { getDatabase } from '../db/client'; // Path check kar lena

export function useSaveAIPractice() {
  return useMutation({
    mutationFn: async ({ mudraId, userId }: { mudraId: string; userId: string }) => {
      const db = await getDatabase();
      
      // Random ID aur aaj ki Date generate karein
      const id = Math.random().toString(36).substring(2, 15);
      const createdAt = new Date().toISOString();

      // DB mein insert karein
      await db.runAsync(
        `INSERT INTO ai_history (id, mudra_id, user_id, created_at) VALUES (?, ?, ?, ?)`,
        [id, mudraId, userId, createdAt]
      );

      return { success: true, mudraId };
    }
  });
}