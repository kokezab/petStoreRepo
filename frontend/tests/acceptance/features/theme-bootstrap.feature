@theme-bootstrap
Feature: System theme applied at bootstrap

  The initial theme is resolved from the operating system preference once, at
  app bootstrap, so a first-time visitor sees the right theme on every route -
  not only after they open Settings (where the theme toggle lives).

  Background:
    Given the pet store app is running with mocked API data

  Scenario: First-time visitor on a dark-mode OS gets a dark app away from Settings
    Given the operating system prefers a dark color scheme
    And no theme preference has been saved
    When I navigate to "/pets"
    Then the app should use the "dark" theme

  Scenario: First-time visitor on a light-mode OS gets a light app
    Given the operating system prefers a light color scheme
    And no theme preference has been saved
    When I navigate to "/pets"
    Then the app should use the "light" theme

  Scenario: A saved preference wins over the OS preference
    Given the operating system prefers a dark color scheme
    And a "light" theme preference has been saved
    When I navigate to "/pets"
    Then the app should use the "light" theme
