package eu.planetsoft.zerocode.web;

import eu.planetsoft.zerocode.service.FieldTypeChangeException;
import eu.planetsoft.zerocode.service.ItemValidationException;
import eu.planetsoft.zerocode.service.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ItemValidationException.class)
    ProblemDetail onItemValidation(ItemValidationException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, ex.getMessage());
        pd.setTitle("Validation failed");
        pd.setProperty("errors", ex.getErrors());
        return pd;
    }

    @ExceptionHandler(FieldTypeChangeException.class)
    ProblemDetail onTypeChange(FieldTypeChangeException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, ex.getMessage());
        pd.setTitle("Field type is immutable");
        return pd;
    }

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail onNotFound(NotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Not found");
        return pd;
    }
}
