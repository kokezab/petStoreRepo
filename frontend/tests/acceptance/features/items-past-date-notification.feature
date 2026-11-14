@items-past-date-notification
Feature: Past date notification for item due date

  Background:
    Given the pet store app is running with mocked API data
    And today is "2026-11-13"
    And the mocked API has the following fields:
      | Field key | Label    | Type | Required | Constraints |
      | due_date  | Due date | DATE | no       |             |
    And the mocked API has the following items:
      | Name          | Description        | Due date   |
      | Sample Widget | A seeded demo item | 2026-12-01 |
      | Old Widget    | An overdue item    | 2026-10-01 |
    And the "items-management" feature flag is enabled

  Scenario: AT-79 Creating an item with a past due date shows a notification
    Given I am on the "/zerocode/items" page
    And I click the "Add item" button
    When I fill in the "Add item" form with:
      | Field    | Value       | Control |
      | Name     | Blue Sprock |         |
      | Due date | 2026-11-01  | date    |
    And I submit the "Add item" form
    Then I should see a notification "Due date is in the past" with "Blue Sprock: Due date is set to 2026-11-01."

  Scenario: AT-80 Updating an item to a past due date shows a notification
    Given I am on the "/zerocode/items" page
    When I click "Edit" for the item "Sample Widget"
    And I fill in the "Edit item" form with:
      | Field    | Value      | Control |
      | Due date | 2026-11-12 | date    |
    And I submit the "Edit item" form
    Then I should see a notification "Due date is in the past" with "Sample Widget: Due date is set to 2026-11-12."

  Scenario Outline: AT-81 Today, future or empty due dates show no notification
    Given I am on the "/zerocode/items" page
    And I click the "Add item" button
    When I fill in the "Add item" form with:
      | Field       | Value       | Control |
      | Name        | Blue Sprock |         |
      | <due field> | <due date>  | date    |
    And I submit the "Add item" form
    Then the "Add item" form should close
    And I should not see any notification

    Examples:
      | due field | due date   |
      | Due date  | 2026-11-13 |
      | Due date  | 2026-12-01 |
      |           |            |

  Scenario: AT-82 Existing past due dates do not notify on page load
    When I navigate to "/zerocode/items"
    Then the item list should include an item named "Old Widget"
    And I should not see any notification

  Scenario: AT-83 A failed save shows no notification
    Given the mocked API returns an error for creating an item
    And I am on the "/zerocode/items" page
    And I click the "Add item" button
    When I fill in the "Add item" form with:
      | Field    | Value       | Control |
      | Name     | Blue Sprock |         |
      | Due date | 2026-11-01  | date    |
    And I submit the "Add item" form
    Then I should see an error message instead of a blank page
    And the "Add item" form should still be open
    And I should not see any notification
