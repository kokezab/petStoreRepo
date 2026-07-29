@bulk-user-creation
Feature: Bulk user creation

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-34 Bulk user creation page is accessible at /users/bulk route
    When I navigate to "/users/bulk"
    Then I should see a "Add users" form
    And the form should start with exactly one user entry

  Scenario: AT-35 Each user entry exposes all fields and all are optional
    Given I am on the "/users/bulk" page
    Then a user entry should have the following fields:
      | Field     | Type     | Required |
      | username  | text     | no       |
      | firstName | text     | no       |
      | lastName  | text     | no       |
      | email     | email    | no       |
      | password  | password | no       |
      | phone     | text     | no       |

  Scenario: AT-36 Adding a user entry with the "+" button
    Given I am on the "/users/bulk" page
    When I click the "+" button to add a user entry
    Then the form should have 2 user entries

  Scenario: AT-37 Removing a user entry with the "-" button
    Given I am on the "/users/bulk" page
    And the form has 2 user entries
    When I click the "-" button on the second user entry
    Then the form should have 1 user entry

  Scenario: AT-38 At least one user entry must always be present
    Given I am on the "/users/bulk" page
    And the form has exactly one user entry
    Then the "-" remove button on the last user entry should be disabled
    And I should not be able to remove the last user entry

  Scenario: AT-39 Submitting the form creates all users in the list
    Given I am on the "/users/bulk" page
    And I fill in the first user entry with username "alice", firstName "Alice", lastName "Smith", email "alice@example.com", password "secret1", phone "111"
    And I click the "+" button to add a user entry
    And I fill in the second user entry with username "bob", firstName "Bob", lastName "Jones", email "bob@example.com", password "secret2", phone "222"
    When I submit the bulk user creation form
    Then the user list should include a user named "alice"
    And the user list should include a user named "bob"

  Scenario: AT-40 An API failure keeps the form open with an error
    Given the mocked API returns an error for creating users
    And I am on the "/users/bulk" page
    And I fill in the first user entry with username "alice", firstName "Alice", lastName "Smith", email "alice@example.com", password "secret1", phone "111"
    When I submit the bulk user creation form
    Then I should see an error message instead of a blank page
    And the "Add users" form should still be visible
