package com.questify.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum QuestionType {
    MULTIPLE_CHOICE("multiple_choice"),
    TRUE_FALSE("true_false"),
    ASSERTION("assertion"),
    MULTIPLE_ANSWER("multiple_answer");

    private final String value;

    QuestionType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static QuestionType fromValue(String value) {
        for (QuestionType type : values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown QuestionType: " + value);
    }
}
