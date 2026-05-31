package com.yeogi.toilet.emergency_toilet.toilet.domain;

import com.yeogi.toilet.emergency_toilet.user.domain.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "toiletrequest")
@Getter
@Setter
@NoArgsConstructor
public class ToiletRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "toilet_id")
    private Toilet toilet;

    private boolean deleteToiletRequest;
    private boolean updateToiletRequest;

    private String content;

    @ManyToOne
    @JoinColumn(name = "requester_id")
    private User requester;

    @ManyToOne
    @JoinColumn(name = "approver_id")
    private User approver;

    private String status = "PENDING";


}
