/*
 * 파일 위치: src/app/components/ReviewDialog.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 화장실 리뷰와 평점을 작성하는 다이얼로그입니다.
 */
import { useState } from "react";
import { Star, MessageSquare, Sparkles, Lock, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import { Toilet } from "../types/toilet";

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  toilet: Toilet | null;
}

export function ReviewDialog({ open, onClose, toilet }: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [hasTissuePaper, setHasTissuePaper] = useState(false);
  const [hasDoorLock, setHasDoorLock] = useState(false);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("전체 평점을 선택해주세요");
      return;
    }

    if (cleanliness === 0) {
      toast.error("청결도를 선택해주세요");
      return;
    }

    // Mock review submission - 실제로는 백엔드 API 호출
    toast.success("리뷰가 등록되었습니다!");
    
    // Reset form
    setRating(0);
    setCleanliness(0);
    setHasTissuePaper(false);
    setHasDoorLock(false);
    setComment("");
    onClose();
  };

  const renderStars = (
    value: number,
    setValue: (val: number) => void,
    label: string
  ) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setValue(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={
                  star <= value
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!toilet) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={24} />
            리뷰 작성
          </DialogTitle>
          <DialogDescription>
            {toilet.name}에 대한 리뷰를 남겨주세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Overall Rating */}
          {renderStars(rating, setRating, "전체 평점 *")}

          {/* Cleanliness */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              <Label>청결도 *</Label>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCleanliness(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      star <= cleanliness
                        ? "fill-blue-400 text-blue-400"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Facilities Check */}
          <div className="space-y-4 pt-2 border-t">
            <h4 className="font-medium text-sm">시설 확인</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-muted-foreground" />
                <Label htmlFor="tissue" className="cursor-pointer">
                  휴지 있음
                </Label>
              </div>
              <Switch
                id="tissue"
                checked={hasTissuePaper}
                onCheckedChange={setHasTissuePaper}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-muted-foreground" />
                <Label htmlFor="doorlock" className="cursor-pointer">
                  도어락 있음
                </Label>
              </div>
              <Switch
                id="doorlock"
                checked={hasDoorLock}
                onCheckedChange={setHasDoorLock}
              />
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">상세 리뷰 (선택사항)</Label>
            <Textarea
              id="comment"
              placeholder="화장실에 대한 의견을 자유롭게 작성해주세요"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              다른 사용자들에게 도움이 되는 정보를 공유해주세요
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" className="flex-1">
              리뷰 등록
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
