package com.yeogi.toilet.emergency_toilet.review.domain;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "review")
@Getter
@Setter
@NoArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "management_no", nullable = false)
    private Toilet toilet;

    private int rating;
    private int cleanliness;
    private boolean hasTissuePaper;
    private boolean hasDoorLock;
    private String comment;

    private LocalDateTime createdAt;
}