package com.yeogi.toilet.emergency_toilet.service;

import com.yeogi.toilet.emergency_toilet.review.domain.Review;
import com.yeogi.toilet.emergency_toilet.review.repository.ReviewRepository;
import com.yeogi.toilet.emergency_toilet.review.service.ReviewService;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletRequest;
import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletStatus;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletRequestDto;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRequestRepository;
import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletRequestService;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.domain.UserFavorite;
import com.yeogi.toilet.emergency_toilet.user.repository.UserFavoriteRepository;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.user.service.FavoriteService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeatureServicesTest {
    @Mock UserRepository users;
    @Mock ToiletRepository toilets;
    @Mock UserFavoriteRepository favorites;
    @Mock ToiletRequestRepository requests;
    @Mock ReviewRepository reviews;
    @Mock JwtUtil jwtUtil;

    private FavoriteService favoriteService;
    private ToiletRequestService requestService;

    @BeforeEach
    void setUp() {
        favoriteService = new FavoriteService(users, favorites, toilets);
        requestService = new ToiletRequestService(jwtUtil, users, requests, toilets);
    }

    @Test
    void favoriteAddHandlesMissingUserToiletAndDuplicate() {
        assertThrows(RuntimeException.class, () -> favoriteService.addFavorite(7L, 9L));
        User user = new User(); user.setId(7L);
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(toilets.findById(9L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> favoriteService.addFavorite(7L, 9L));

        Toilet toilet = new Toilet(); toilet.setId(9L);
        when(toilets.findById(9L)).thenReturn(Optional.of(toilet));
        when(favorites.existsByUserAndToilet(user, toilet)).thenReturn(true);
        assertThrows(RuntimeException.class, () -> favoriteService.addFavorite(7L, 9L));
        verify(favorites, never()).save(any());
    }

    @Test
    void favoriteAddAndRemovePersistAndRejectMissingFavorite() {
        User user = new User(); user.setId(7L);
        Toilet toilet = new Toilet(); toilet.setId(9L);
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(toilets.findById(9L)).thenReturn(Optional.of(toilet));
        when(favorites.existsByUserAndToilet(user, toilet)).thenReturn(false, true, false);

        favoriteService.addFavorite(7L, 9L);
        verify(favorites).save(any(UserFavorite.class));
        favoriteService.deleteFavorite(7L, 9L);
        verify(favorites).deleteByUserAndToilet(user, toilet);
        assertThrows(RuntimeException.class, () -> favoriteService.deleteFavorite(7L, 9L));
    }

    @Test
    void requestCreationHandlesMissingRequesterToiletAndAdminAndSetsPending() {
        ToiletRequestDto dto = new ToiletRequestDto(); dto.setToiletId(9L); dto.setContent("확인 요청");
        assertThrows(RuntimeException.class, () -> requestService.addToiletRequest(dto, 7L));

        User requester = new User(); requester.setId(7L);
        when(users.findById(7L)).thenReturn(Optional.of(requester));
        assertThrows(RuntimeException.class, () -> requestService.addToiletRequest(dto, 7L));

        Toilet toilet = new Toilet(); toilet.setId(9L); toilet.setIsUserSubmitted(false);
        when(toilets.findById(9L)).thenReturn(Optional.of(toilet));
        when(users.findByRole("ADMIN")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> requestService.addToiletRequest(dto, 7L));

        User admin = new User(); admin.setId(1L); admin.setRole("ADMIN");
        when(users.findByRole("ADMIN")).thenReturn(Optional.of(admin));
        when(requests.save(any(ToiletRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ToiletRequest saved = requestService.addToiletRequest(dto, 7L);
        assertEquals("PENDING", saved.getStatus());
        assertSame(requester, saved.getRequester());
        assertSame(admin, saved.getApprover());
    }

    @Test
    void requestRejectionChecksExistenceAndApprover() {
        assertThrows(RuntimeException.class, () -> requestService.rejectToiletRequest(3L, 7L));
        User approver = new User(); approver.setId(8L);
        ToiletRequest request = new ToiletRequest(); request.setApprover(approver);
        when(requests.findById(3L)).thenReturn(Optional.of(request));
        assertThrows(RuntimeException.class, () -> requestService.rejectToiletRequest(3L, 7L));
        assertEquals("PENDING", request.getStatus());
        assertEquals("REJECTED", requestService.rejectToiletRequest(3L, 8L).getStatus());
    }

    @Test
    void toiletRatingRoundingAndDeletionAreStableAtZero() {
        Toilet toilet = new Toilet();
        toilet.updateRatingWhenReviewAdded(4);
        toilet.updateRatingWhenReviewAdded(5);
        assertEquals(2, toilet.getReviewCount());
        assertEquals(4.5, toilet.getRating());
        toilet.updateRatingWhenReviewDeleted(5);
        assertEquals(1, toilet.getReviewCount());
        assertEquals(4.0, toilet.getRating());
        toilet.updateRatingWhenReviewDeleted(4);
        assertEquals(0, toilet.getReviewCount());
        assertEquals(0.0, toilet.getRating());
        toilet.updateRatingWhenReviewDeleted(1);
        assertEquals(0.0, toilet.getRating());
    }

    @Test
    void reviewDeleteRejectsMissingAndOtherUsersAndUpdatesRatingForOwner() {
        ReviewService service = new ReviewService(reviews, users, toilets);
        assertThrows(RuntimeException.class, () -> service.deleteUserReview(7L, 4L));
        User owner = new User(); owner.setId(8L);
        Toilet toilet = new Toilet(); toilet.updateRatingWhenReviewAdded(3);
        Review review = new Review(); review.setUser(owner); review.setToilet(toilet); review.setRating(3);
        when(reviews.findById(4L)).thenReturn(Optional.of(review));
        assertThrows(RuntimeException.class, () -> service.deleteUserReview(7L, 4L));
        service.deleteUserReview(8L, 4L);
        assertEquals(0, toilet.getReviewCount());
        verify(reviews).delete(review);
    }
}
