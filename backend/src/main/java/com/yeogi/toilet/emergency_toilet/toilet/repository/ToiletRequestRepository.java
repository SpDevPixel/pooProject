package com.yeogi.toilet.emergency_toilet.toilet.repository;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletRequest;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ToiletRequestRepository extends JpaRepository<ToiletRequest, Long> {

    @Query("SELECT tr FROM ToiletRequest tr " +
            "JOIN FETCH tr.requester r " +
            "JOIN FETCH tr.toilet t " +
            "WHERE tr.approver.id = :approverId " +
            "AND tr.deleteToiletRequest = true " +
            "AND tr.status = 'PENDING'")
    List<ToiletRequest> findDeleteRequestsByApproverId(@Param("approverId") Long approverId);

    @Query("SELECT tr FROM ToiletRequest tr " +
            "JOIN FETCH tr.requester r " +
            "JOIN FETCH tr.toilet t " +
            "WHERE tr.approver.id = :approverId " +
            "AND tr.updateToiletRequest = true " +
            "AND tr.status = 'PENDING'")
    List<ToiletRequest> findUpdateRequestsByApproverId(@Param("approverId") Long approverId);

    @Modifying
    @Query("DELETE FROM ToiletRequest tr WHERE tr.toilet.id = :toiletId")
    void deleteByToiletId(@Param("toiletId") Long toiletId);

    @Modifying
    @Query("delete from ToiletRequest tr where tr.requester = :requester")
    void deleteByRequester(@Param("requester") User requester);

    @Modifying
    @Query("delete from ToiletRequest tr where tr.approver = :approver")
    void deleteByApprover(@Param("approver") User approver);

    @Modifying
    @Query("delete from ToiletRequest tr where tr.toilet = :toilet")
    void deleteByToilet(@Param("toilet") Toilet toilet);
}

