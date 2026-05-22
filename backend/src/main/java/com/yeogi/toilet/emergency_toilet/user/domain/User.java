package com.yeogi.toilet.emergency_toilet.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 이제 PK가 숫자형 Long id 입니다.

    @Column(nullable = false, unique = true)
    private String userId; // 사용자가 로그인할 때 쓰는 "문자열 아이디"
    private String email;
    private String password;
    private String address;

    private String name;

    private String nickname;
    private String role = "USER";
}
