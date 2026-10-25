@field-management
Feature: Field management

  Background:
    Given the pet store app is running with mocked API data
    And the following fields exist:
      | Label      | Type   | Required |
      | Serial no. | TEXT   | yes      |
      | Weight     | NUMBER | no       |

  # Read

  Scenario: AT-41 Field list shows existing fields
    When I navigate to "/zerocode/fields"
    Then the field list should include a field labelled "Serial no." of type "TEXT" that is required
    And the field list should include a field labelled "Weight" of type "NUMBER" that is optional

  Scenario: AT-42 Management actions hidden when the feature flag is disabled
    Given the "field-management" feature flag is disabled
    When I navigate to "/zerocode/fields"
    Then I should not see an "Add field" button
    And I should not see "Edit" or "Delete" actions for the field "Weight"

  # Create

  Scenario: AT-43 Add field button opens the form when the feature flag is enabled
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    When I click the "Add field" button
    Then I should see the "Add field" form

  Scenario Outline: AT-44 Submitting a valid form adds the field to the list
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I fill in the "Add field" form with:
      | Field    | Value      |
      | Label    | <label>    |
      | Type     | <type>     |
      | Required | <required> |
    And I submit the "Add field" form
    Then the "Add field" form should close
    And the field list should include a field labelled "<label>" of type "<type>"

    Examples:
      | label        | type     | required |
      | Color        | TEXT     | yes      |
      | In stock     | BOOLEAN  | no       |
      | Delivered at | DATETIME | no       |

  Scenario: AT-45 Empty required fields show validation errors and keep the form open
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I submit the "Add field" form without filling it in
    Then I should see a "Label is required" validation message
    And I should see a "Type is required" validation message
    And the "Add field" form should still be open

  Scenario: AT-46 An API failure on create keeps the form open with an error
    Given the "field-management" feature flag is enabled
    And the mocked API returns an error for creating a field
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I fill in the "Add field" form with:
      | Field | Value |
      | Label | Color |
      | Type  | TEXT  |
    And I submit the "Add field" form
    Then I should see an error message instead of a blank page
    And the "Add field" form should still be open

  Scenario: AT-47 Cancelling the add form does not create a field
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I fill in the "Add field" form with:
      | Field | Value |
      | Label | Color |
    And I cancel the "Add field" form
    Then the "Add field" form should close
    And the field list should not include a field labelled "Color"

  # Update

  Scenario: AT-48 Edit form is pre-filled with the field's current values
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    When I click "Edit" for the field "Weight"
    Then I should see the "Edit field" form
    And the "Label" input should contain "Weight"
    And the "Type" select should have "NUMBER" selected
    And the "Required" checkbox should be unchecked

  Scenario: AT-49 Saving the edit form updates the field in the list
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click "Edit" for the field "Weight"
    When I fill in the "Edit field" form with:
      | Field    | Value       |
      | Label    | Weight (kg) |
      | Required | yes         |
    And I submit the "Edit field" form
    Then the "Edit field" form should close
    And the field list should include a field labelled "Weight (kg)" of type "NUMBER" that is required
    And the field list should not include a field labelled "Weight"

  Scenario: AT-50 Clearing the label on edit shows a validation error
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click "Edit" for the field "Weight"
    When I clear the "Label" input
    And I submit the "Edit field" form
    Then I should see a "Label is required" validation message
    And the "Edit field" form should still be open

  # Delete

  Scenario: AT-51 Confirming deletion removes the field from the list
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    When I click "Delete" for the field "Weight"
    And I confirm the deletion
    Then the field list should not include a field labelled "Weight"
    And the field list should include a field labelled "Serial no." of type "TEXT" that is required

  Scenario: AT-52 Cancelling deletion keeps the field in the list
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    When I click "Delete" for the field "Weight"
    And I cancel the deletion
    Then the field list should include a field labelled "Weight" of type "NUMBER" that is optional

  Scenario: AT-53 An API failure on delete keeps the field and shows an error
    Given the "field-management" feature flag is enabled
    And the mocked API returns an error for deleting a field
    And I am on the "/zerocode/fields" page
    When I click "Delete" for the field "Weight"
    And I confirm the deletion
    Then I should see an error message instead of a blank page
    And the field list should include a field labelled "Weight" of type "NUMBER" that is optional
