@items-management
Feature: Time picker for TIME fields

  Background:
    Given the pet store app is running with mocked API data
    And the mocked API has the following fields:
      | Field key | Label     | Type | Required | Constraints |
      | opens_at  | Opens at  | TIME | yes      |             |
      | closes_at | Closes at | TIME | no       |             |
    And the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page

  Scenario: AT-75 A TIME field is rendered as a time picker
    When I click the "Add item" button
    And I open the "Closes at" time picker
    Then I should see hour, minute and second columns
    And the time picker should offer a "Now" option

  Scenario: AT-76 Now fills in the current time
    When I click the "Add item" button
    And I open the "Closes at" time picker
    And I choose "Now" in the time picker
    Then the "Closes at" field should contain the current time as "HH:mm:ss"

  Scenario: AT-77 Clear is only offered for optional TIME fields
    When I click the "Add item" button
    And I pick "09:30:00" in the "Opens at" time picker
    And I pick "17:00:00" in the "Closes at" time picker
    Then the "Closes at" field should offer a clear button
    And the "Opens at" field should not offer a clear button

  Scenario: AT-78 Picked time is saved as HH:mm:ss
    When I click the "Add item" button
    And I fill in "Name" with "Shop"
    And I pick "09:30:00" in the "Opens at" time picker
    And I click the "Save" button
    Then the item "Shop" should be created with "opens_at" set to "09:30:00"
