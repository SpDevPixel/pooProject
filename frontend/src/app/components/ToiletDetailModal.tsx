/*
 * 파일 위치: src/app/components/ToiletDetailModal.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 선택한 화장실의 상세 정보, 편의시설, 리뷰 액션을 보여주는 모달입니다.
 */
import { useState } from "react";
import { 
  Accessibility, 
  Baby, 
  Bell, 
  Camera, 
  Clock, 
  MapPin, 
  Phone, 
  Star,
  MessageSquare,
  Heart,
  Building2,
  Trash2,
} from "lucide-react";
import type { Toilet } from "../types/toilet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ReviewDialog } from "./ReviewDialog";
import { mockReviews } from "../data/mockReviews";
import { Separator } from "./ui/separator";
import { useFavorites } from "../contexts/FavoritesContext";
import { toast } from "sonner";

interface ToiletDetailModalProps {
  toilet: Toilet | null;
  open: boolean;
  onClose: () => void;
}

export function ToiletDetailModal({ toilet, open, onClose }: ToiletDetailModalProps) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!toilet) return null;

  const toiletReviews = mockReviews.filter((review) => review.toiletId === toilet.id);

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

  const handleToggleFavorite = () => {
    const wasFavorite = isFavorite(toilet.id);
    toggleFavorite(toilet.id);
    if (wasFavorite) {
      toast.success("즐겨찾기에서 제거되었습니다");
    } else {
      toast.success("즐겨찾기에 추가되었습니다");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{toilet.name}</DialogTitle>
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

            {/* Reviews Section */}
            {toiletReviews.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <MessageSquare size={16} />
                      최근 리뷰 ({toiletReviews.length})
                    </h3>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {toiletReviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{review.userName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(review.rating)}
                              <span className="text-xs text-muted-foreground">
                                청결도: {review.cleanliness}/5
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

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
                onClick={handleToggleFavorite}
                variant="outline"
              >
                <Heart
                  size={16}
                  className={`mr-2 ${isFavorite(toilet.id) ? "fill-red-500 text-red-500" : ""}`}
                />
                즐겨찾기
              </Button>
              <Button onClick={onClose}>
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReviewDialog
        open={isReviewDialogOpen}
        onClose={() => setIsReviewDialogOpen(false)}
        toilet={toilet}
      />
    </>
  );
}
