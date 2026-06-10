/*
 * 파일 위치: src/app/components/ToiletDetailModal.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 선택한 화장실의 상세 정보, 편의시설, 리뷰 액션을 표시하는 모달
 */
import { useCallback, useEffect, useState } from "react";
import { 
  Accessibility, 
  Baby, 
  Bell, 
  Camera, 
  Clock, 
  MapPin, 
  Navigation,
  Phone, 
  Star,
  MessageSquare,
  Building2,
  Trash2,
  FilePenLine,
  Send,
} from "lucide-react";
import type { Toilet } from "../types/toilet";
import type { RoutePoint } from "../api/tmapRoutes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ReviewDialog } from "./ReviewDialog";
import { Separator } from "./ui/separator";
import { useFavorites } from "../contexts/FavoritesContext";
import { useAuth } from "../contexts/AuthContext";
import { addToiletRequest, type ToiletRequestType } from "../api/toiletRequests";
import { fetchToiletReviews } from "../api/reviews";
import { toast } from "sonner";
import type { Review } from "../types/toilet";

interface ToiletDetailModalProps {
  toilet: Toilet | null;
  open: boolean;
  onClose: () => void;
  onStartNavigation?: (toilet: Toilet, start?: RoutePoint) => void;
  isStartingNavigation?: boolean;
  onReviewStatsChange?: (managementNo: string, rating: number, reviewCount: number) => void;
}

const getReviewStats = (reviews: Review[]) => {
  const reviewCount = reviews.length;
  if (reviewCount === 0) {
    return { rating: 0, reviewCount };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    rating: Math.round((totalRating / reviewCount) * 10) / 10,
    reviewCount,
  };
};

const getRecentReviews = (reviews: Review[]) =>
  [...reviews]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

export function ToiletDetailModal({
  toilet,
  open,
  onClose,
  onStartNavigation,
  isStartingNavigation = false,
  onReviewStatsChange,
}: ToiletDetailModalProps) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<ToiletRequestType | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [toiletReviews, setToiletReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, isAuthenticated } = useAuth();

  // 리뷰 조회와 평점 갱신
  const loadReviews = useCallback(async () => {
    if (!toilet?.managementNo) {
      setToiletReviews([]);
      return;
    }

    setIsLoadingReviews(true);
    setReviewError(null);

    try {
      const reviews = await fetchToiletReviews(toilet.managementNo);
      setToiletReviews(reviews);
      const { rating, reviewCount } = getReviewStats(reviews);
      onReviewStatsChange?.(toilet.managementNo, rating, reviewCount);
    } catch (error) {
      console.error(error);
      setReviewError(error instanceof Error ? error.message : "리뷰를 불러오지 못했습니다.");
    } finally {
      setIsLoadingReviews(false);
    }
  }, [onReviewStatsChange, toilet?.managementNo]);

  useEffect(() => {
    if (!open || !toilet) {
      setToiletReviews([]);
      setReviewError(null);
      return;
    }

    void loadReviews();
  }, [loadReviews, open, toilet?.managementNo]);

  if (!toilet) return null;

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  // 즐겨찾기 토글
  const handleToggleFavorite = async () => {
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);

    try {
      const added = await toggleFavorite(toilet);
      toast.success(added ? "즐겨찾기에 추가되었습니다." : "즐겨찾기에서 제거되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "즐겨찾기 처리에 실패했습니다."
      );
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const getRequestContext = () => {
    if (!isAuthenticated || !user) {
      toast.error("로그인 후 요청을 보낼 수 있습니다.");
      return null;
    }

    const requesterId = Number(user.id);
    if (!Number.isFinite(requesterId)) {
      toast.error("사용자 정보를 확인하지 못했습니다. 다시 로그인해주세요.");
      return null;
    }

    if (!toilet.backendId) {
      toast.error("화장실 정보를 다시 불러온 뒤 요청해주세요.");
      return null;
    }

    return {
      requesterId,
      token: user.token,
    };
  };

  const openRequestDialog = (type: ToiletRequestType) => {
    if (!getRequestContext()) return;
    setRequestType(type);
    setRequestMessage("");
  };

  const closeRequestDialog = () => {
    setRequestType(null);
    setRequestMessage("");
  };

  const handleSubmitRequest = async () => {
    if (!requestType) return;

    const requestContext = getRequestContext();
    if (!requestContext) return;

    const trimmedMessage = requestMessage.trim();
    if (!trimmedMessage) {
      toast.error(
        requestType === "UPDATE"
          ? "수정 요청 내용을 입력해주세요."
          : "삭제 요청 사유를 입력해주세요."
      );
      return;
    }

    setIsSubmittingRequest(true);

    try {
      const request = await addToiletRequest({
        toilet,
        type: requestType,
        message: trimmedMessage,
        ...requestContext,
      });

      toast.success(
        `${request.recipientLabel}에게 ${
          requestType === "UPDATE" ? "수정" : "삭제"
        } 요청을 보냈습니다.`
      );
      closeRequestDialog();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : `${requestType === "UPDATE" ? "수정" : "삭제"} 요청에 실패했습니다.`
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // 새 리뷰 즉시 반영
  const handleReviewCreated = (review: Review) => {
    const nextReviews = [review, ...toiletReviews];
    setToiletReviews(nextReviews);

    const { rating, reviewCount } = getReviewStats(nextReviews);
    onReviewStatsChange?.(toilet.managementNo, rating, reviewCount);
    void loadReviews();
  };

  // 상세 모달 렌더링
  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2 text-xl">
              <span className="min-w-0 truncate">{toilet.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                aria-label={
                  isFavorite(toilet) ? "즐겨찾기 취소" : "즐겨찾기 추가"
                }
                className="h-10 w-10 shrink-0"
              >
                <Star
                  size={30}
                  className={
                    isFavorite(toilet)
                      ? "fill-yellow-400 text-yellow-500"
                      : "text-gray-400"
                  }
                />
              </Button>
            </DialogTitle>
            <DialogDescription>
              화장실의 상세 정보를 확인하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Data source badge and rating */}
            <div className="flex items-center justify-between">
              <Badge variant={toilet.isUserSubmitted ? "secondary" : "default"}>
                {toilet.isUserSubmitted ? "사용자 등록" : "공공 데이터"}
              </Badge>
              {toilet.rating && (
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(toilet.rating))}
                  <span className="text-sm font-semibold">{toilet.rating.toFixed(1)}</span>
                  {toilet.reviewCount && (
                    <span className="text-xs text-muted-foreground">
                      ({toilet.reviewCount}개 리뷰)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">기본 정보</h3>
              
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">주소</p>
                  <p className="text-sm text-muted-foreground">{toilet.roadAddress}</p>
                </div>
              </div>

              {toilet.openTime && (
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">운영 시간</p>
                    <p className="text-sm text-muted-foreground break-words">{toilet.openTime}</p>
                    {toilet.openTimeDetail && (
                      <p className="text-xs text-muted-foreground break-words">{toilet.openTimeDetail}</p>
                    )}
                  </div>
                </div>
              )}

              {toilet.phoneNumber && (
                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">관리기관 연락처</p>
                    <p className="text-sm text-muted-foreground">{toilet.phoneNumber}</p>
                  </div>
                </div>
              )}

              {toilet.managingOrg && (
                <div className="flex items-start gap-3">
                  <Building2 size={20} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">관리기관</p>
                    <p className="text-sm text-muted-foreground">{toilet.managingOrg}</p>
                  </div>
                </div>
              )}

              {toilet.wasteDisposal && (
                <div className="flex items-start gap-3">
                  <Trash2 size={20} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">화장실 방식</p>
                    <p className="text-sm text-muted-foreground">{toilet.wasteDisposal}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Facilities */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">시설 특징</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    toilet.hasDisabledFacility
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200 opacity-50"
                  }`}
                >
                  <Accessibility
                    size={20}
                    className={toilet.hasDisabledFacility ? "text-blue-600" : "text-gray-400"}
                  />
                  <span className="text-sm">장애인 시설</span>
                </div>

                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    toilet.hasDiaperTable
                      ? "bg-pink-50 border-pink-200"
                      : "bg-gray-50 border-gray-200 opacity-50"
                  }`}
                >
                  <Baby
                    size={20}
                    className={toilet.hasDiaperTable ? "text-pink-600" : "text-gray-400"}
                  />
                  <span className="text-sm">기저귀 교환대</span>
                </div>

                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    toilet.hasEmergencyBell
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200 opacity-50"
                  }`}
                >
                  <Bell
                    size={20}
                    className={toilet.hasEmergencyBell ? "text-red-600" : "text-gray-400"}
                  />
                  <span className="text-sm">비상벨</span>
                </div>

                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    toilet.hasEntranceCctv
                      ? "bg-purple-50 border-purple-200"
                      : "bg-gray-50 border-gray-200 opacity-50"
                  }`}
                >
                  <Camera
                    size={20}
                    className={toilet.hasEntranceCctv ? "text-purple-600" : "text-gray-400"}
                  />
                  <span className="text-sm">입구 CCTV</span>
                </div>
              </div>
            </div>

            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <MessageSquare size={16} />
                  최근 리뷰 ({toiletReviews.length})
                </h3>
              </div>

              {isLoadingReviews ? (
                <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-muted-foreground">
                  리뷰를 불러오는 중입니다.
                </div>
              ) : reviewError ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {reviewError}
                </div>
              ) : toiletReviews.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-muted-foreground">
                  아직 작성된 리뷰가 없습니다.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {getRecentReviews(toiletReviews).map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-medium text-sm">{review.userName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-xs text-muted-foreground">
                              청결도: {review.cleanliness}/5
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {review.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={() => setIsReviewDialogOpen(true)}
                variant="outline"
                className="col-span-2"
              >
                <MessageSquare size={16} className="mr-2" />
                리뷰 작성
              </Button>
              <Button
                onClick={() => toilet && onStartNavigation?.(toilet)}
                disabled={!onStartNavigation || isStartingNavigation}
              >
                <Navigation size={16} className="mr-2" />
                {isStartingNavigation ? "경로 찾는 중" : "길 안내"}
              </Button>
              <Button onClick={onClose} variant="outline">
                닫기
              </Button>
              <Button onClick={() => openRequestDialog("UPDATE")} variant="outline">
                <FilePenLine size={16} className="mr-2" />
                수정요청
              </Button>
              <Button onClick={() => openRequestDialog("DELETE")} variant="outline">
                <Send size={16} className="mr-2" />
                삭제요청
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReviewDialog
        open={isReviewDialogOpen}
        onClose={() => setIsReviewDialogOpen(false)}
        toilet={toilet}
        onCreated={handleReviewCreated}
      />

      <Dialog open={!!requestType} onOpenChange={(isOpen) => !isOpen && closeRequestDialog()}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {requestType === "UPDATE" ? "수정 요청" : "삭제 요청"}
            </DialogTitle>
            <DialogDescription>
              요청 내용을 입력하면 알림으로 전달됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
              rows={4}
              autoFocus
              placeholder={
                requestType === "UPDATE"
                  ? "수정이 필요한 내용을 입력해주세요."
                  : "삭제가 필요한 이유를 입력해주세요."
              }
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeRequestDialog} disabled={isSubmittingRequest}>
                취소
              </Button>
              <Button onClick={handleSubmitRequest} disabled={isSubmittingRequest}>
                {isSubmittingRequest ? "전송 중..." : "확인"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
