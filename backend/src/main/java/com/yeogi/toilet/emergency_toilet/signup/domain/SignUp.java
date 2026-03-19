package com.yeogi.toilet.emergency_toilet.signup.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SignUp {

    private String email;
    private String password;

    private String name;
    private int ymd;
    private int phon;

    private String nickname;

}
