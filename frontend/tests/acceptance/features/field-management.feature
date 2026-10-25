@field-management
Feature: Field management

  Background:
    Given the pet store app is running with mocked API data
    And the mocked API has the following fields:
      | Field key | Label    | Type   | Required | Constraints  |
      | color     | Color    | TEXT   | no       | maxLength=40 |
      | quantity  | Quantity | NUMBER | yes      | min=0        |

  # Read

  Scenario: AT-41 Field list shows existing fields in display order
    When I navigate to "/zerocode/fields"
    Then I should see the following fields in order:
      | Field key | Label    | Type   | Required | Constraints  |
      | color     | Color    | TEXT   | no       | maxLength=40 |
      | quantity  | Quantity | NUMBER | yes      | min=0        |

  Scenario: AT-42 Management actions hidden when the feature flag is disabled
    Given the "field-management" feature flag is disabled
    When I navigate to "/zerocode/fields"
    Then I should not see an "Add field" button
    And I should not see "Edit" or "Delete" actions for the field "Color"

  # Create

  Scenario: AT-43 Add field button opens the form when the feature flag is enabled
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    When I click the "Add field" button
    Then I should see the "Add field" form

  Scenario Outline: AT-44 Constraint inputs depend on the selected type
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I chose dropdown "Type" value "<type>"
    Then I should see the constraint inputs "<inputs>"

    Examples:
      | type     | inputs           |
      | TEXT     | Max length       |
      | NUMBER   | Minimum, Maximum |
      | BOOLEAN  |                  |
      | DATE     |                  |
      | TIME     |                  |
      | DATETIME |                  |

  Scenario Outline: AT-45 Submitting a valid form adds the field to the end of the list
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I fill in the "Add field" form with:
      | Field    | Value      | Control  |
      | Label    | <label>    | text     |
      | Type     | <type>     | select   |
      | Required | <required> | checkbox |
    And I submit the "Add field" form
    Then the "Add field" form should close
    And the last field in the list should be:
      | Field key | Label   | Type   | Required   |
      | <key>     | <label> | <type> | <required> |

    Examples:
      | label        | type     | required | key          |
      | Serial no.   | TEXT     | yes      | serial_no    |
      | In stock     | BOOLEAN  | no       | in_stock     |
      | Delivered at | DATETIME | no       | delivered_at |

  Scenario Outline: AT-46 Constraints are saved with the field
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I fill in the "Add field" form with:
      | Field   | Value   | Control |
      | Label   | <label> | text    |
      | Type    | <type>  | select  |
      | <c1>    | <v1>    | text    |
      | <c2>    | <v2>    | text    |
    And I submit the "Add field" form
    Then the field "<label>" should have constraints "<constraints>"

    Examples:
      | label  | type   | c1         | v1 | c2      | v2 | constraints  |
      | Code   | TEXT   | Max length | 20 |         |    | maxLength=20 |
      | Rating | NUMBER | Minimum    | 1  | Maximum | 5  | min=1, max=5 |

  Scenario: AT-47 A label whose key is already taken gets a numbered field key
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I fill in the "Add field" form with:
      | Field | Value | Control |
      | Label | Color | text    |
      | Type  | TEXT  | select  |
    And I submit the "Add field" form
    Then the last field in the list should be:
      | Field key | Label | Type | Required |
      | color_2   | Color | TEXT | no       |

  Scenario Outline: AT-48 Invalid input shows a validation error and keeps the form open
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I fill in the "Add field" form with:
      | Field | Value   | Control |
      | Label | <label> | text    |
      | Type  | <type>  | select  |
    And I submit the "Add field" form
    Then I should see a "<message>" validation message
    And the "Add field" form should still be open
    And no field should have been created

    Examples:
      | label | type | message                                         |
      |       | TEXT | Label is required                               |
      | Code  |      | Type is required                                |
      | !!!   | TEXT | Label must contain at least one letter or digit |

  Scenario: AT-49 An API failure on create keeps the form open with an error
    Given the "field-management" feature flag is enabled
    And the mocked API returns an error for creating a field
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I fill in the "Add field" form with:
      | Field | Value | Control |
      | Label | Code  | text    |
      | Type  | TEXT  | select  |
    And I submit the "Add field" form
    Then I should see an error message instead of a blank page
    And the "Add field" form should still be open

  Scenario: AT-50 Cancelling the add form does not create a field
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click the "Add field" button
    When I fill in the "Add field" form with:
      | Field | Value |
      | Label | Code  |
    And I cancel the "Add field" form
    Then the "Add field" form should close
    And no field should have been created

  # Update

  Scenario: AT-51 Edit form is pre-filled and the type cannot be changed
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    When I click "Edit" for the field "Quantity"
    Then I should see the "Edit field" form
    And the "Label" input should contain "Quantity"
    And the "Type" select should show "NUMBER" and be disabled
    And the "Required" checkbox should be checked
    And the "Minimum" input should contain "0"

  Scenario: AT-52 Saving the edit form updates the field but keeps its key
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click "Edit" for the field "Quantity"
    When I fill in the "Edit field" form with:
      | Field    | Value       | Control  |
      | Label    | Stock count | text     |
      | Required | no          | checkbox |
      | Maximum  | 999         | text     |
    And I submit the "Edit field" form
    Then the "Edit field" form should close
    And I should see the following fields in order:
      | Field key | Label       | Type   | Required | Constraints     |
      | color     | Color       | TEXT   | no       | maxLength=40    |
      | quantity  | Stock count | NUMBER | no       | min=0, max=999  |

  Scenario: AT-53 Clearing the label on edit shows a validation error
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    And I click "Edit" for the field "Quantity"
    When I clear the "Label" input
    And I submit the "Edit field" form
    Then I should see a "Label is required" validation message
    And the "Edit field" form should still be open

  Scenario: AT-54 Editing a field that was deleted elsewhere shows an error
    Given the "field-management" feature flag is enabled
    And the mocked API returns "not found" for updating a field
    And I am on the "/zerocode/fields" page
    And I click "Edit" for the field "Quantity"
    When I submit the "Edit field" form
    Then I should see an error message instead of a blank page
    And the "Edit field" form should still be open

  # Delete

  Scenario: AT-55 Confirming deletion removes the field from the list
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    When I click "Delete" for the field "Color"
    And I confirm the deletion
    Then I should see the following fields in order:
      | Field key | Label    | Type   | Required | Constraints |
      | quantity  | Quantity | NUMBER | yes      | min=0       |

  Scenario: AT-56 Cancelling deletion keeps the field in the list
    Given the "field-management" feature flag is enabled
    And I am on the "/zerocode/fields" page
    When I click "Delete" for the field "Color"
    And I cancel the deletion
    Then the field list should include a field labelled "Color"

  Scenario: AT-57 An API failure on delete keeps the field and shows an error
    Given the "field-management" feature flag is enabled
    And the mocked API returns an error for deleting a field
    And I am on the "/zerocode/fields" page
    When I click "Delete" for the field "Color"
    And I confirm the deletion
    Then I should see an error message instead of a blank page
    And the field list should include a field labelled "Color"
