@items-management
Feature: Items management

  Background:
    Given the pet store app is running with mocked API data
    And the mocked API has the following fields:
      | Field key | Label    | Type   | Required | Constraints  |
      | color     | Color    | TEXT   | no       | maxLength=40 |
      | quantity  | Quantity | NUMBER | yes      | min=0        |
    And the mocked API has the following items:
      | Name          | Description         | Color | Quantity |
      | Sample Widget | A seeded demo item  | red   | 10       |
      | Sample Gadget | Another seeded item |       | 3        |

  # Read

  Scenario: AT-58 Item list shows a column per custom field
    When I navigate to "/zerocode/items"
    Then I should see the following items in order:
      | Name          | Description         | Color | Quantity |
      | Sample Widget | A seeded demo item  | red   | 10       |
      | Sample Gadget | Another seeded item |       | 3        |

  Scenario: AT-59 Management actions hidden when the feature flag is disabled
    Given the "items-management" feature flag is disabled
    When I navigate to "/zerocode/items"
    Then I should not see an "Add item" button
    And I should not see "Edit" or "Delete" actions for the item "Sample Widget"

  # Create

  Scenario: AT-60 Add item form has an input for every custom field in display order
    Given the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page
    When I click the "Add item" button
    Then I should see the "Add item" form
    And the "Add item" form should have the inputs "Name, Description, Color, Quantity"

  Scenario Outline: AT-61 Submitting a valid form adds the item to the end of the list
    Given the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page
    And I click the "Add item" button
    When I fill in the "Add item" form with:
      | Field       | Value         |
      | Name        | <name>        |
      | Description | <description> |
      | Color       | <color>       |
      | Quantity    | <quantity>    |
    And I submit the "Add item" form
    Then the "Add item" form should close
    And the last item in the list should be:
      | Name   | Description   | Color   | Quantity   |
      | <name> | <description> | <color> | <quantity> |

    Examples:
      | name        | description       | color | quantity |
      | Blue Sprock | A brand new thing | blue  | 5        |
      | Bare Bolt   |                   |       | 0        |

  Scenario Outline: AT-62 Values of every field type are saved and shown in the list
    Given the "items-management" feature flag is enabled
    And the mocked API also has an optional "<type>" field labelled "<label>"
    And I am on the "/zerocode/items" page
    And I click the "Add item" button
    When I fill in the "Add item" form with:
      | Field    | Value   | Control   |
      | Name     | Probe   | text      |
      | Quantity | 1       | text      |
      | <label>  | <value> | <control> |
    And I submit the "Add item" form
    Then the last item in the list should be:
      | Name  | <label> |
      | Probe | <shown> |

    Examples:
      | type     | label        | control  | value               | shown            |
      | BOOLEAN  | In stock     | checkbox | yes                 | Yes              |
      | DATE     | Delivered on | date     | 2026-11-02          | 2026-11-02       |
      | TIME     | Opens at     | time     | 09:30:00            | 09:30:00         |
      | DATETIME | Shipped at   | date     | 2026-11-02 09:30:00 | 2026-11-02 09:30 |

  Scenario Outline: AT-63 Invalid input shows a validation error and keeps the form open
    Given the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page
    And I click the "Add item" button
    When I fill in the "Add item" form with:
      | Field    | Value      |
      | Name     | <name>     |
      | Quantity | <quantity> |
    And I submit the "Add item" form
    Then I should see a "<message>" validation message
    And the "Add item" form should still be open
    And no item should have been created

    Examples:
      | name  | quantity | message                      |
      |       | 5        | Name is required             |
      | Probe |          | Quantity is required         |
      | Probe | -1       | Quantity must be at least 0  |

  Scenario: AT-64 Field errors returned by the API are shown next to the matching input
    Given the "items-management" feature flag is enabled
    And the mocked API rejects creating an item with the field errors:
      | Field key | Message        |
      | quantity  | below min of 0 |
    And I am on the "/zerocode/items" page
    And I click the "Add item" button
    When I fill in the "Add item" form with:
      | Field    | Value |
      | Name     | Probe |
      | Quantity | 5     |
    And I submit the "Add item" form
    Then the "Quantity" input should show the error "below min of 0"
    And the "Add item" form should still be open

  Scenario: AT-65 An API failure on create keeps the form open with an error
    Given the "items-management" feature flag is enabled
    And the mocked API returns an error for creating an item
    And I am on the "/zerocode/items" page
    And I click the "Add item" button
    When I fill in the "Add item" form with:
      | Field    | Value |
      | Name     | Probe |
      | Quantity | 5     |
    And I submit the "Add item" form
    Then I should see an error message instead of a blank page
    And the "Add item" form should still be open

  Scenario: AT-66 Cancelling the add form does not create an item
    Given the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page
    And I click the "Add item" button
    When I fill in the "Add item" form with:
      | Field | Value |
      | Name  | Probe |
    And I cancel the "Add item" form
    Then the "Add item" form should close
    And no item should have been created

  # Update

  Scenario: AT-67 Edit form is pre-filled with the item's values
    Given the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page
    When I click "Edit" for the item "Sample Widget"
    Then I should see the "Edit item" form
    And the "Name" input should contain "Sample Widget"
    And the "Description" input should contain "A seeded demo item"
    And the "Color" input should contain "red"
    And the "Quantity" input should contain "10"

  Scenario: AT-68 Saving the edit form updates the item
    Given the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page
    And I click "Edit" for the item "Sample Widget"
    When I fill in the "Edit item" form with:
      | Field    | Value        |
      | Name     | Super Widget |
      | Quantity | 12           |
    And I clear the "Color" input
    And I submit the "Edit item" form
    Then the "Edit item" form should close
    And I should see the following items in order:
      | Name          | Description         | Color | Quantity |
      | Super Widget  | A seeded demo item  |       | 12       |
      | Sample Gadget | Another seeded item |       | 3        |

  Scenario: AT-69 Clearing the name on edit shows a validation error
    Given the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page
    And I click "Edit" for the item "Sample Widget"
    When I clear the "Name" input
    And I submit the "Edit item" form
    Then I should see a "Name is required" validation message
    And the "Edit item" form should still be open

  Scenario: AT-70 Values of deleted fields are not sent back on save
    Given the "items-management" feature flag is enabled
    And the item "Sample Widget" also has the value "legacy" for the deleted field "old_field"
    And I am on the "/zerocode/items" page
    And I click "Edit" for the item "Sample Widget"
    When I submit the "Edit item" form
    Then the "Edit item" form should close

  Scenario: AT-71 Editing an item that was deleted elsewhere shows an error
    Given the "items-management" feature flag is enabled
    And the mocked API returns "not found" for updating an item
    And I am on the "/zerocode/items" page
    And I click "Edit" for the item "Sample Widget"
    When I submit the "Edit item" form
    Then I should see an error message instead of a blank page
    And the "Edit item" form should still be open

  # Delete

  Scenario: AT-72 Confirming deletion removes the item from the list
    Given the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page
    When I click "Delete" for the item "Sample Widget"
    And I confirm the deletion
    Then I should see the following items in order:
      | Name          | Description         | Color | Quantity |
      | Sample Gadget | Another seeded item |       | 3        |

  Scenario: AT-73 Cancelling deletion keeps the item in the list
    Given the "items-management" feature flag is enabled
    And I am on the "/zerocode/items" page
    When I click "Delete" for the item "Sample Widget"
    And I cancel the deletion
    Then the item list should include an item named "Sample Widget"

  Scenario: AT-74 An API failure on delete keeps the item and shows an error
    Given the "items-management" feature flag is enabled
    And the mocked API returns an error for deleting an item
    And I am on the "/zerocode/items" page
    When I click "Delete" for the item "Sample Widget"
    And I confirm the deletion
    Then I should see an error message instead of a blank page
    And the item list should include an item named "Sample Widget"
