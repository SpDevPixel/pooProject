package com.yeogi.toilet.emergency_toilet.toilet.domain;

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

}
