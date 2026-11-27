package com.yeogi.toilet.emergency_toilet.user.dto;

import com.yeogi.toilet.emergency_toilet.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Setter;

@Setter
@AllArgsConstructor
public class UserResponseDto {
    private Long id;
    private String userId;
    private String email;
    private String name;
    private String nickname;
    private String role;

    public static UserResponseDto from(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getUserId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole()
        );
    }

}
