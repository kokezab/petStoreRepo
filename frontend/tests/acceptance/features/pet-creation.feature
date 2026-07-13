@pet-creation
Feature: Pet creation

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-15 Add pet button hidden when the feature flag is disabled
    Given the "pet-creation" feature flag is disabled
    When I navigate to "/pets"
    Then I should not see an "Add pet" button

  Scenario: AT-15.5 Add pet button visible when the feature flag is enabled
    Given the "pet-creation" feature flag is enabled
    When I navigate to "/pets"
    Then I should see an "Add pet" button

  Scenario: AT-16 Add pet button visible and opens the form when the feature flag is enabled
    Given the pet-creation common flow
    Then I should see the "Add pet" form

  Scenario: AT-17 Submitting a valid form adds the pet to the list
    Given the pet-creation common flow
    And I fill in the pet creation form with name "Buddy", category "Dogs" and status "available"
    And I submit the pet creation form
    Then the "Add pet" form should close
    And the pet list should include a pet named "Buddy"

  Scenario: AT-18 Empty required fields show validation errors
    Given the "pet-creation" feature flag is enabled
    And I am on the "/pets" page
    When I click the "Add pet" button
    And I submit the pet creation form without filling it in
    Then I should see a "Name is required" validation message
    And I should see a "Category is required" validation message
    And the "Add pet" form should still be open

  Scenario: AT-19 An API failure keeps the form open with an error
    Given the "pet-creation" feature flag is enabled
    And the mocked API returns an error for adding a pet
    And I am on the "/pets" page
    When I click the "Add pet" button
    And I fill in the pet creation form with name "Buddy", category "Dogs" and status "available"
    And I submit the pet creation form
    Then I should see an error message instead of a blank page
    And the "Add pet" form should still be open

  Scenario: AT-20 Cancelling the form closes it without creating a pet
    Given the "pet-creation" feature flag is enabled
    And I am on the "/pets" page
    When I click the "Add pet" button
    And I fill in the pet creation form with name "Buddy", category "Dogs" and status "available"
    And I cancel the pet creation form
    Then the "Add pet" form should close
    And the pet list should not include a pet named "Buddy"
