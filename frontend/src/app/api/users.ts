/*
 * 파일 위치: src/app/api/users.ts
 * 상위 폴더: src/app/api (백엔드 API 통신 함수)
 * 역할: 백엔드 사용자 API를 호출합니다.
 */

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "/api";

const getUserApiErrorMessage = (response: Response, fallback: string) => {
  if (response.status === 400) {
    return fallback;
  }

  if (response.status === 401) {
    return "로그인이 필요합니다. 다시 로그인해주세요.";
  }

  if (response.status === 403) {
    return "요청 권한이 없습니다. 다시 로그인한 뒤 시도해주세요.";
  }

  if (response.status >= 500) {
    return "서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  return fallback;
};

export type SignupRequest = {
  id: string;
  email: string;
  password: string;
  address: string;
  name: string;
  nickname: string;
};

export type LoginRequest = {
  id: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export type BackendUser = {
  id: string;
  email: string;
  address?: string | null;
  name: string;
  nickname?: string | null;
  role?: string | null;
};

export const signupUser = async (payload: SignupRequest): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/user-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(getUserApiErrorMessage(response, "회원가입에 실패했습니다. 입력한 정보를 확인해주세요."));
  }
};

export const loginUser = async (payload: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(getUserApiErrorMessage(response, "일치하는 정보가 없습니다"));
  }

  return response.json() as Promise<LoginResponse>;
};

export const loginWithAnyIdentifier = async (
  identifiers: Array<string | null | undefined>,
  password: string
): Promise<LoginResponse> => {
  const uniqueIdentifiers = Array.from(
    new Set(identifiers.map((identifier) => identifier?.trim()).filter(Boolean))
  ) as string[];

  let lastError: unknown;

  for (const id of uniqueIdentifiers) {
    try {
      return await loginUser({ id, password });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("일치하는 정보가 없습니다");
};

export const fetchMyInfo = async (token: string): Promise<BackendUser> => {
  const response = await fetch(`${API_BASE_URL}/users/my-info`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getUserApiErrorMessage(response, "사용자 정보를 불러오지 못했습니다."));
  }

  return response.json() as Promise<BackendUser>;
};

export const changePassword = async (token: string, newPassword: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/users/change-pw?newPw=${encodeURIComponent(newPassword)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(getUserApiErrorMessage(response, "비밀번호 변경에 실패했습니다."));
  }
};
