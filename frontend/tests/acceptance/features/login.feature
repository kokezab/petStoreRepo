@login
Feature: User login page

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-22 Login page is accessible at /login route
    When I navigate to "/login"
    Then I should see a "Log In" form
    And the form "Log in" should have the following fields:
      | Field    | Type     | Required |
      | username | text     | yes      |
      | password | password | yes      |

  Scenario: AT-23 Missing required fields validation
    Given I am on the "/login" page
    When the user attempts to submit "Log in" form with one or more required fields empty
    Then validation errors are displayed next to the empty required fields (username, password)
    And the form is not submitted to the API
    And the user remains on the "/login" page

  Scenario: AT-24 Successful login redirects to the pet list
    Given I am on the "/login" page
    When I submit the login form with valid credentials
    Then I should be redirected to "/pets"

  Scenario: AT-25 Invalid credentials show an error message
    Given the mocked API returns an authentication error for the login request
    And I am on the "/login" page
    When I submit the login form with invalid credentials
    Then I should see an error message
    And the user remains on the "/login" page
