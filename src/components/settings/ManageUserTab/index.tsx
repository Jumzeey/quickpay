import ActionButton from '@/components/action-button';
import DynamicTable from '@/components/DynamicTable';
import Icon from '@/components/icon';
import Pagination from '@/components/pagination';
import { getUsers } from "@/services/settings";
import { notifyError } from '@/util/utils';
import React, { useCallback, useEffect, useState } from 'react';
import * as Yup from 'yup';
import CreateUpdateRolesModal from './create-update-roles-modal';
import CreateUpdateUserModal from './create-update-user-modal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface ModalState {
  isOpen: boolean;
  isCreateOpen: boolean;
  isManageRolesOpen: boolean;
  isEditOpen: boolean;
  isDeleteOpen: boolean;
  activeId: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  role: Yup.string().required('Role is required'),
});

const ManageUsers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    isCreateOpen: false,
    isManageRolesOpen: false,
    isEditOpen: false,
    isDeleteOpen: false,
    activeId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([] as any);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // const { data: users, loading, refetch } = useAsyncFetch({
  //   key: 'get-users',
  //   fn: async () => {
  //     const response = await getUsers();
  //     return response?.data || [];
  //   }
  // });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading("fetch-users");
      const users = await getUsers();
      setUsers(users);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(null);
    }
  };

  // const users: User[] = data?.data?.users || [];
  // const pagination = data?.data?.pagination || {
  const pagination = {
    total: 0,
    last_page: 1,
    per_page: 10,
  };

  // Modal handlers
  const openCreateModal = () => {
    setModalState((prev) => ({ ...prev, isCreateOpen: true }));
  };

  const openManageRolesModal = () => {
    setModalState((prev) => ({ ...prev, isManageRolesOpen: true }));
  };

  const openEditModal = (user: User) => {
    if (user) {
      setCurrentUser(user);
      setModalState((prev) => ({
        ...prev,
        isEditOpen: true,
        activeId: user.id
      }));
    }
  };

  const openDeleteModal = (id: string) => {
    setModalState((prev) => ({ ...prev, isDeleteOpen: true, activeId: id }));
  };

  const closeModals = () => {
    setModalState({
      isOpen: false,
      isCreateOpen: false,
      isManageRolesOpen: false,
      isEditOpen: false,
      isDeleteOpen: false,
      activeId: '',
    });
    setCurrentUser(null);
  };

  // API handlers
  const onSuccess = () => {
    closeModals();
    fetchUsers();
  }

  // Pagination handler
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchUsers();
    },
    [fetchUsers]
  );

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      render: (value: string, row: any) => (
        <span className="text-sm">{row.firstname} {row.lastname}</span>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      render: (value: string) => <span className="text-sm">{value}</span>,
    },
    {
      key: 'role',
      title: 'Role',
      render: (value: string) => <span className="text-sm capitalize">{value}</span>,
    },
    {
      key: 'actions',
      title: '',
      render: (_: any, row: User) => (
        <button
          onClick={() => openEditModal(row)}
          className="text-blue-600 hover:text-blue-800"
        >
          <Icon name="edit2" size="18" />
        </button>
      ),
    },
  ];

  return (
    <>
      {!users?.length ? (
        <div className="p-8 text-center flex flex-col items-center space-y-4">
          <p className="text-gray-500 text-sm dark:text-gray-400">
            No users available.
            Add a user to get started.
          </p>

          <div className='grid grid-cols-2 gap-3'>
            <ActionButton
              text="Manage roles"
              ariaLabel="Manage roles button"
              onClick={openManageRolesModal}
              className="justify-center !gap-0"
            />

            <ActionButton
              text="Create new user"
              ariaLabel="Add user button"
              onClick={openCreateModal}
              iconName="user-add"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <DynamicTable
            columns={columns}
            data={users || []}
            maxColumns={4}
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="-mt-6">
              {/* <Pagination
                lastPage={pagination?.last_page}
                currentPage={pagination?.current_page}
                totalPages={pagination.last_page}
                onPageChange={handlePageChange}
              /> */}
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <ActionButton
                text="Manage roles"
                ariaLabel="Manage roles button"
                onClick={openManageRolesModal}
                className="justify-center !gap-0"
              />

              <ActionButton
                text="Create new user"
                ariaLabel="Add user button"
                onClick={openCreateModal}
                iconName="user-add"
              />
            </div>
          </div>
        </div>
      )}

      {modalState.isCreateOpen || modalState.isEditOpen ? (
        <CreateUpdateUserModal
          isOpen={modalState.isCreateOpen || modalState.isEditOpen}
          onClose={closeModals}
          onSuccess={onSuccess}
          isUpdateUser={modalState.isEditOpen}
          userData={currentUser}
        />
      ) : null}

      {modalState.isManageRolesOpen ? (
        <CreateUpdateRolesModal
          isOpen={modalState.isManageRolesOpen}
          onClose={closeModals}
          onSuccess={onSuccess}
        />
      ) : null}
    </>
  );
};

export default ManageUsers;