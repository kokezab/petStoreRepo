@user-signup
Feature: User signup page

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-21 Signup page is accessible at /signup route
    When I navigate to "/signup"
    Then I should see a "Sign Up" form
    And the form "Sign up" should have the following fields:
      | Field    | Type     | Required |
      | username | text     | yes      |
      | password | password | yes      |
      | email    | email    | yes      |
      | firstName| text     | no       |
      | lastName | text     | no       |
      | phone    | text     | no       |

  Scenario: Missing Required Fields Validation
    Given I am on the "/signup" page
    When the user attempts to submit "Sign up" form with one or more required fields empty
    Then validation errors are displayed next to the empty required fields (username, password, email)
    And the form is not submitted to the API
    And the user remains on the "/signup" page
