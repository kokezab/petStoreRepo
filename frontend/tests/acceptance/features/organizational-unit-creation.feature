@organizational-unit-creation
Feature: Organizational unit creation

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-30 Add organizational unit button hidden when the feature flag is disabled
    Given the "organizational-unit-creation" feature flag is disabled
    When I navigate to "/organizational-units"
    Then I should not see an "Add organizational unit" button

  Scenario: AT-31 Add organizational unit button opens the form when the feature flag is enabled
    Given the "organizational-unit-creation" feature flag is enabled
    And I am on the "/organizational-units" page
    When I click the "Add organizational unit" button
    Then I should see the "Add organizational unit" form

  Scenario: AT-32 Submitting a valid form adds the organizational unit to the list
    Given the "organizational-unit-creation" feature flag is enabled
    And I am on the "/organizational-units" page
    And I click the "Add organizational unit" button
    When I fill in the "Add organizational unit" form with:
      | Field | Value       |
      | Name  | Engineering |
    And I submit the "Add organizational unit" form
    Then the "Add organizational unit" form should close
    And the organizational unit list should include an organizational unit named "Engineering"

  Scenario: AT-33 Empty required field shows a validation error and keeps the form open
    Given the "organizational-unit-creation" feature flag is enabled
    And I am on the "/organizational-units" page
    And I click the "Add organizational unit" button
    When I submit the "Add organizational unit" form without filling it in
    Then I should see a "Name is required" validation message
    And the "Add organizational unit" form should still be open
