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
    private String id;
    private String email;
    private String password;
    private String address;

    private String name;

    private String nickname;

}
