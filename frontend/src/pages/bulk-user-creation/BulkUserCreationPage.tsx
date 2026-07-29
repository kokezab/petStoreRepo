import { useState } from 'react';

import type { User } from '@/api/generated/models';
import { showSuccessMessage } from '@/lib/antd-message-bridge';

import { useBulkCreateUsers } from './model/useBulkCreateUsers';
import { BulkUserForm } from './ui';

export function BulkUserCreationPage() {
  const [createdUsers, setCreatedUsers] = useState<User[]>([]);
  const { createUsers, isPending, error } = useBulkCreateUsers();

  const handleSubmit = async (users: User[]): Promise<boolean> => {
    try {
      await createUsers(users);
      setCreatedUsers(users);
      showSuccessMessage('Users created successfully');
      return true;
    } catch {
      // Failure is surfaced via `error` on the form.
      return false;
    }
  };

  return (
    <div>
      <h1>Add users</h1>
      <BulkUserForm onSubmit={handleSubmit} isLoading={isPending} error={error} />

      {createdUsers.length > 0 && (
        <section aria-label='Created users'>
          <h2>Created users</h2>
          <ul aria-label='Users'>
            {createdUsers.map((user, index) => (
              <li key={user.username ?? index}>{user.username}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
