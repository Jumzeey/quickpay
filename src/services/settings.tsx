import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

interface AddUser {
  firstname: string;
  lastname: string;
  email: string;
  // phone: string;
  role?: string;
  otp?: string;
}

export async function getAPICredentials() {
  try {
    const response = await api.get(apiEndpoints.settings.GET_API_CREDENTIALS);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getUsers() {
  try {
    const response = await api.get(apiEndpoints.settings.GET_USERS);
    return response.data?.users;
  } catch (error) {
    throw error;
  }
}

export async function addUser(payload: AddUser, id: number, isUpdate: boolean) {
  const { ADD_USER, UPDATE_USER } = apiEndpoints.settings;
  const endpoint = isUpdate
    ? api.put(`${UPDATE_USER}/${id}`, payload)
    : api.post(ADD_USER, payload);

  try {
    const response = await endpoint;
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getRoles() {
  try {
    const response = await api.get(apiEndpoints.settings.GET_ROLES);
    console.log('roles ', response.data?.[0]?.roles);
    return response.data?.[0]?.roles;
  } catch (error) {
    throw error;
  }
}

export async function deleteRole(id: number) {
  try {
    const response = await api.delete(`${apiEndpoints.settings.DELETE_ROLE}/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getPermissions() {
  try {
    const response = await api.get(apiEndpoints.settings.GET_PERMISSIONS);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function changeUserStatus(id: string) {
  try {
    const response = await api.get(
      `${apiEndpoints.settings.CHANGE_USER_STATUS}/${id}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getPermissionsByRoleId(id: string) {
  try {
    const response = await api.get(
      `${apiEndpoints.settings.GET_ROLE_PERMISSIONS}/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function addRole(payload: { name: string; permissions: any[] }) {
  try {
    const response = await api.post(apiEndpoints.settings.ADD_ROLE, payload);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateRole(payload: { id: number, name: string; permissions: any[] }) {
  try {
    const response = await api.put(apiEndpoints.settings.UPDATE_ROLE, payload);
    return response;
  } catch (error) {
    throw error;
  }
}


export async function generateAccessKey() {
  try {
    const response = await api.post(apiEndpoints.settings.GENERATE_ACCESS_KEY);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function generateEncrytionKey() {
  try {
    const response = await api.post(
      apiEndpoints.settings.GENERATE_ENCRYPTION_KEY
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateProfileImage(avatar: File) {
  try {
    const formData = new FormData();
    formData.append("avatar", avatar);
    const response = await api.post(apiEndpoints.settings.UPDATE_PROFILE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getUserLog(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.settings.GET_USER_LOG}`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getMids(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.mids.GET_MIDS}`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getCategories(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.categories.GET_CATEGORIES}`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

