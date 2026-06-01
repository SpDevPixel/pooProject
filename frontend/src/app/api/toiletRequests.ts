import type { Toilet } from "../types/toilet";

export type ToiletRequestType = "UPDATE" | "DELETE";

type BackendUserSummary = {
  id?: number | string | null;
  userId?: string | null;
  name?: string | null;
  nickname?: string | null;
};

type BackendToiletSummary = {
  id?: number | string | null;
  managementNo?: string | number | null;
  name?: string | null;
  roadAddress?: string | null;
  isUserSubmitted?: boolean | null;
};

type BackendToiletRequest = {
  id: number | string;
  toilet?: BackendToiletSummary | null;
  deleteToiletRequest?: boolean | null;
  updateToiletRequest?: boolean | null;
  content?: string | null;
  requester?: BackendUserSummary | null;
  approver?: BackendUserSummary | null;
  status?: string | null;
};

export interface ToiletRequestNotification {
  id: string;
  type: ToiletRequestType;
  toiletId: string;
  managementNo: string;
  toiletName: string;
  roadAddress: string;
  recipientLabel: string;
  requesterName: string;
  requesterUserId: string;
  message: string;
  status: string;
}

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "/api";

const getRequestApiErrorMessage = (response: Response, fallback: string) => {
  if (response.status === 401 || response.status === 403) {
    return "로그인이 만료되었거나 요청 권한이 없습니다. 다시 로그인해주세요.";
  }

  if (response.status >= 500) {
    return "서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  return fallback;
};

const getBackendToiletId = (toilet: Toilet) => {
  if (typeof toilet.backendId === "number" && Number.isFinite(toilet.backendId)) {
    return toilet.backendId;
  }

  const numericId = Number(toilet.id);
  return Number.isFinite(numericId) ? numericId : null;
};

const normalizeRequest = (
  request: BackendToiletRequest,
  type: ToiletRequestType
): ToiletRequestNotification => {
  const toilet = request.toilet;
  const requester = request.requester;
  const approver = request.approver;
  const requesterDisplayId = requester?.userId ?? requester?.id?.toString() ?? "-";

  return {
    id: request.id.toString(),
    type,
    toiletId: toilet?.id?.toString() ?? "",
    managementNo: toilet?.managementNo?.toString() ?? "",
    toiletName: toilet?.name ?? "화장실 정보 없음",
    roadAddress: toilet?.roadAddress ?? "",
    recipientLabel: approver?.name ?? approver?.userId ?? "나",
    requesterName: requester?.name ?? requester?.nickname ?? requesterDisplayId,
    requesterUserId: requesterDisplayId,
    message: request.content ?? "",
    status: request.status ?? "PENDING",
  };
};

export const addToiletRequest = async ({
  toilet,
  type,
  message,
  requesterId,
  token,
}: {
  toilet: Toilet;
  type: ToiletRequestType;
  message: string;
  requesterId: number;
  token: string;
}) => {
  const toiletId = getBackendToiletId(toilet);

  if (!toiletId) {
    throw new Error("요청할 화장실의 DB 식별자를 찾지 못했습니다. 화장실 정보를 다시 불러와주세요.");
  }

  const response = await fetch(`${API_BASE_URL}/requests/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      toiletId,
      requester: requesterId,
      deleteToiletRequest: type === "DELETE",
      updateToiletRequest: type === "UPDATE",
      content: message,
    }),
  });

  if (!response.ok) {
    throw new Error(
      getRequestApiErrorMessage(response, `${type === "UPDATE" ? "수정" : "삭제"} 요청 등록에 실패했습니다.`)
    );
  }

  return {
    recipientLabel: toilet.isUserSubmitted ? "등록자" : "관리자",
  };
};

export const getToiletRequests = async (token: string): Promise<ToiletRequestNotification[]> => {
  const [updateResponse, deleteResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/requests/received/update`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${API_BASE_URL}/requests/received/delete`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  if (!updateResponse.ok) {
    throw new Error(getRequestApiErrorMessage(updateResponse, "수정 요청 알림을 불러오지 못했습니다."));
  }

  if (!deleteResponse.ok) {
    throw new Error(getRequestApiErrorMessage(deleteResponse, "삭제 요청 알림을 불러오지 못했습니다."));
  }

  const [updateRequests, deleteRequests] = (await Promise.all([
    updateResponse.json(),
    deleteResponse.json(),
  ])) as [BackendToiletRequest[], BackendToiletRequest[]];

  return [
    ...updateRequests.map((request) => normalizeRequest(request, "UPDATE")),
    ...deleteRequests.map((request) => normalizeRequest(request, "DELETE")),
  ];
};

export const deleteToiletRequestNotification = async (
  requestId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/requests/${encodeURIComponent(requestId)}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getRequestApiErrorMessage(response, "요청 삭제 처리에 실패했습니다."));
  }
};
