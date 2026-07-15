@user-signup
Feature: User signup page

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-21 Signup page is accessible at /signup route
    When I navigate to "/signup"
    Then I should see a "Sign Up" form
    And the form should have the following fields:
      | Field    | Type     | Required |
      | username | text     | yes      |
      | password | password | yes      |
      | email    | email    | yes      |
      | firstName| text     | no       |
      | lastName | text     | no       |
      | phone    | text     | no       |