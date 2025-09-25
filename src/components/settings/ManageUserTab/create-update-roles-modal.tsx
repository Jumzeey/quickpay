import ActionButton from '@/components/action-button';
import Button from '@/components/button';
import FormInput from '@/components/FormInput';
import Icon from '@/components/icon';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import { useAsyncFetch } from '@/hooks/useAsyncFetch';
import { useFormValidation } from '@/hooks/useFormValidation';
import { addRole, deleteRole, getPermissions, getRoles, updateRole } from '@/services/settings';
import { capitalizeFirstLetter, notifyError, notifySuccess } from '@/util/utils';
import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import * as Yup from 'yup';

interface CreateUpdateRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const validationSchema = Yup.object({
    roleName: Yup.string().required('Role name is required!'),
});

interface CreateRoleFormValues {
    roleName: string;
}

export interface RoleListItem {
    id: number;
    name: string;
    created_at: string;
    no_of_users: number;
    permissions: PermissionItem[];
}

interface PermissionItem {
    id: number;
    name: string;
}

interface Permission {
    roles: Role[];
    dashboard: Role[];
    'collection-history': Role[];
    disbursement: Role[];
    'kyc-verification': Role[];
    subaccount: Role[];
    'api-keys': Role[];
    webhooks: Role[];
    mandates: Role[];
    'payment-link': Role[];
    'virtual-accounts': Role[];
    'settlement-account': Role[];
    'settlement-history': Role[];
    profile: Role[];
    'customer-balance': Role[];
    users: Role[];
    [key: string]: Role[];
}

interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    description: string;
    pivot: {
        role_id: number;
        permission_id: number;
    }
};


const CreateUpdateRoleModal: React.FC<CreateUpdateRoleModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<RoleListItem[]>([]);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [action, setAction] = useState<'create' | 'update' | null>(null);
    const [roleData, setRoleData] = useState<any>(null);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useFormValidation<CreateRoleFormValues>(
        validationSchema, {
        defaultValues: {
            roleName: '',
        },
        mode: 'onChange'
    });

    const { data: permissions = [], loading } = useAsyncFetch<Permission[]>({
        key: 'get-permissions',
        fn: async () => {
            const response = await getPermissions();
            return response || [];
        }
    });

    // INFO: not working
    // const { data: roles, loading: isLoadingRoles } = useAsyncFetch<RoleListItem[]>({
    //     key: 'get-roles-init',
    //     fn: async () => {
    //         const response = await getRoles();
    //         console.log('her2 ', response)
    //         return response || [];
    //     }
    // });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setIsLoading("get-roles");
            const roles = await getRoles();
            setRoles(roles);
        } catch (error: any) {
            notifyError(error.message);
        } finally {
            setIsLoading(null);
        }
    };

    const handleCheckboxChange = (id: number) => {
        setSelectedIds((prevSelectedIds: any) => {
            if (prevSelectedIds.includes(id)) {
                return prevSelectedIds.filter((selectedId: any) => selectedId !== id);
            } else {
                return [...prevSelectedIds, id];
            }
        });
    };

    useEffect(() => {
        if (isOpen && action === 'update' && roleData) {
            reset({
                roleName: roleData.name || '',
            });
        } else if (isOpen && action === 'create') {
            reset({
                roleName: '',
            });
        }
    }, [isOpen, action, roleData, reset]);

    const onSubmit = async (values: CreateRoleFormValues) => {
        setIsSubmitting(true);
        try {
            if (action === 'update') {
                const payload = {
                    id: roleData.id,
                    name: values.roleName,
                    permissions: selectedIds,
                };

                // Call update role API
                await updateRole(payload);
                notifySuccess("Role updated successfully");
            } else {
                const payload = {
                    name: values.roleName,
                    permissions: selectedIds,
                };

                // Call create role API
                await addRole(payload);
                notifySuccess("Role created successfully");
            }
        } catch (error: any) {
            notifyError(error.message || `Failed to ${action === 'update' ? 'update' : 'create'} role`);
        } finally {
            fetchRoles();
            setView('list');
            setIsSubmitting(false);
            setAction(null);
        }
    };

    const handleEditRole = (role: RoleListItem) => {
        if (role) {
            setView('create');
            setAction('update');
            reset({
                roleName: role.name || '',
            });
            const existingIds = role?.permissions;

            const result = existingIds?.map((item: any) => {
                return item.id;
            });

            setRoleData(role);
            setSelectedIds(result);
        }
    }

    const handleDeleteRole = async (id: number) => {
        setIsLoading("delete-role");
        try {
            await deleteRole(id);
            notifySuccess("Role deleted successfully");
            fetchRoles();
        } catch (error: any) {
            notifyError(error.message || "Failed to delete role");
        } finally {
            setIsLoading(null);
            // closeModal();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={view === "list" ? "Manage Roles" : action === 'update' ? "Update Role" : "Create Role"}
            width={view === "create"}
        >
            {view === "list" && (
                <div className="mt-5">
                    <div className="flex justify-end items-center">
                        <ActionButton
                            text="Create new role"
                            ariaLabel="Create new role button"
                            onClick={() => setView("create")}
                            className="justify-center !gap-0"
                        />
                    </div>

                    <ul className="divide-y divide-[#C4C4C452]">
                        {isLoading === "get-roles" ? (
                            <div className="flex justify-center py-10">
                                <Loader />
                            </div>
                        ) : roles?.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center space-y-4">
                                <p className="text-gray-500 text-sm dark:text-gray-400">
                                    No roles available.
                                    Create a new role to get started.
                                </p>
                            </div>
                        ) : (
                            roles?.map((role) => (
                                <li key={role.id} className="py-4 px-0.5 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-black">{role.name}</span>

                                    <div className="flex space-x-6">
                                        <button
                                            onClick={() => handleEditRole(role)}
                                        >
                                            <Icon name="edit2" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRole(role.id)}
                                            disabled={isLoading === "delete-role"}
                                        >
                                            <Icon name="delete2" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {view === "create" && (
                <div className="mt-5">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-5">
                            <div className="w-2/5">
                                <Controller
                                    name="roleName"
                                    control={control}
                                    render={({ field }) => (
                                        <FormInput
                                            label="Name your role:"
                                            id="roleName"
                                            type="text"
                                            htmlFor="roleName"
                                            error={errors.roleName?.message}
                                            touched={!!errors.roleName}
                                            {...field}
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <h2 className="text-[#7F7F7F] font-semibold text-sm pb-2.5">
                                    Access rights:
                                </h2>

                                <div>
                                    {/* <div className="flex justify-center mb-4">
                                        <Button
                                            text="Select All"
                                            ariaLabel="Select all permissions"
                                            onClick={handleSelectAll}
                                            primary
                                            type="button"
                                            className="text-xs px-4 py-1"
                                        />
                                    </div> */}

                                    {loading ? (
                                        <div className="flex justify-center py-10">
                                            <Loader />
                                        </div>
                                    ) : Array.isArray(permissions) && permissions.length > 0 ? (
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {permissions?.map((item, index) => (
                                                <div key={index} className="grid grid-cols-1 gap-4 mb-4">
                                                    {Object.keys(item).map((key: any) => (
                                                        <div
                                                            key={key}
                                                            className="bg-white p-5 border border-[#C4C4C43D] rounded-lg"
                                                        >
                                                            <p className="text-sm font-medium text-black mb-4">
                                                                {capitalizeFirstLetter(key)}
                                                            </p>

                                                            <div className="grid grid-cols-3 gap-5">
                                                                {item?.[key]?.map((permission: PermissionItem) => (
                                                                    <div key={permission.id}>
                                                                        <label className="flex items-center gap-2 text-[13px] text-[#7F7F7F] font-medium cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="form-checkbox h-3 w-3 text-[#005BB0]"
                                                                                checked={selectedIds.includes(permission.id)}
                                                                                onChange={() => handleCheckboxChange(permission.id)}
                                                                            />
                                                                            <span>{permission.name}</span>
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No permissions found
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-[113px]">
                                <Button
                                    className="font-medium text-white mt-5 text-xs p-2 rounded w-full"
                                    text={isSubmitting ? <Loader /> : action === 'update' ? "Update" : "Create"}
                                    ariaLabel={`${action === 'update' ? "Update" : "Create"} Role`}
                                    disabled={isSubmitting || loading || selectedIds.length === 0}
                                    primary
                                    type="submit"
                                />
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </Modal>
    );
};

export default CreateUpdateRoleModal;