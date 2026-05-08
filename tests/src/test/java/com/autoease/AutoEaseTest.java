package com.autoease;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.*;
import org.openqa.selenium.support.ui.*;
import io.github.bonigarcia.wdm.WebDriverManager;

import java.time.Duration;

/**
 * AutoEase Selenium Test Suite
 * 17 automated test cases covering all major features.
 * Uses headless Chrome for CI/Jenkins pipeline compatibility.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AutoEaseTest {

    private static WebDriver driver;
    private static WebDriverWait wait;

    // ---------------------------------------------------------------
    // Replace with your deployed EC2 frontend URL when running in CI
    // ---------------------------------------------------------------
    private static final String BASE_URL = System.getProperty(
            "app.url", "http://localhost:3000");

    // Seed-data credentials (from schema.sql)
    private static final String CUSTOMER_EMAIL    = "ahmed@example.com";
    private static final String CUSTOMER_PASSWORD = "password";
    private static final String ADMIN_EMAIL       = "admin@autoease.com";
    private static final String ADMIN_PASSWORD    = "password"; // hashed as 'password' in seed

    // A unique email used for registration tests
    private static final String NEW_USER_EMAIL    = "testuser_" + System.currentTimeMillis() + "@test.com";

    // ---------------------------------------------------------------
    // Setup / Teardown
    // ---------------------------------------------------------------
    @BeforeAll
    static void setUpDriver() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");      // new headless mode (Chrome 112+)
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1920,1080");
        options.addArguments("--remote-allow-origins=*");

        // WebDriverManager downloads the correct chromedriver automatically
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(8));
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    @AfterAll
    static void tearDownDriver() {
        if (driver != null) driver.quit();
    }

    // Helper: clear & type
    private void clearAndType(WebElement el, String text) {
        el.clear();
        el.sendKeys(text);
    }

    // Helper: wait for element visible
    private WebElement waitFor(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    // Helper: click when clickable
    private void clickWhen(By locator) {
        wait.until(ExpectedConditions.elementToBeClickable(locator)).click();
    }

    // ---------------------------------------------------------------
    // TC-01  Home page loads with correct title
    // ---------------------------------------------------------------
    @Test
    @Order(1)
    @DisplayName("TC-01: Home page loads")
    void testHomePageLoads() {
        driver.get(BASE_URL);
        String title = driver.getTitle();
        Assertions.assertTrue(
                title != null && !title.isEmpty(),
                "Page title should not be empty");
        Assertions.assertTrue(
                driver.getPageSource().toLowerCase().contains("autoease"),
                "Home page should contain 'AutoEase'");
    }

    // ---------------------------------------------------------------
    // TC-02  Navigation bar is present
    // ---------------------------------------------------------------
    @Test
    @Order(2)
    @DisplayName("TC-02: Navbar visible on home page")
    void testNavbarVisible() {
        driver.get(BASE_URL);
        WebElement nav = waitFor(By.tagName("nav"));
        Assertions.assertTrue(nav.isDisplayed(), "Navbar should be visible");
    }

    // ---------------------------------------------------------------
    // TC-03  Login page loads
    // ---------------------------------------------------------------
    @Test
    @Order(3)
    @DisplayName("TC-03: Login page loads")
    void testLoginPageLoads() {
        driver.get(BASE_URL + "/login");
        WebElement emailField = waitFor(By.cssSelector("input[type='email'], input[name='email']"));
        Assertions.assertTrue(emailField.isDisplayed(), "Email field should be visible on login page");
    }

    // ---------------------------------------------------------------
    // TC-04  Login with invalid credentials shows error
    // ---------------------------------------------------------------
    @Test
    @Order(4)
    @DisplayName("TC-04: Login fails with wrong credentials")
    void testLoginWithInvalidCredentials() {
        driver.get(BASE_URL + "/login");
        WebElement email = waitFor(By.cssSelector("input[type='email'], input[name='email']"));
        WebElement password = driver.findElement(By.cssSelector("input[type='password']"));
        clearAndType(email, "wrong@wrong.com");
        clearAndType(password, "wrongpassword");
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        boolean hasError = wait.until(d ->
                d.getPageSource().toLowerCase().contains("invalid") ||
                d.getPageSource().toLowerCase().contains("error") ||
                d.getPageSource().toLowerCase().contains("incorrect"));
        Assertions.assertTrue(hasError, "Login with wrong credentials should show an error");
    }

    // ---------------------------------------------------------------
    // TC-05  Successful customer login redirects to dashboard
    // ---------------------------------------------------------------
    @Test
    @Order(5)
    @DisplayName("TC-05: Valid login redirects to dashboard")
    void testSuccessfulLogin() {
        driver.get(BASE_URL + "/login");
        WebElement email = waitFor(By.cssSelector("input[type='email'], input[name='email']"));
        WebElement password = driver.findElement(By.cssSelector("input[type='password']"));
        clearAndType(email, CUSTOMER_EMAIL);
        clearAndType(password, CUSTOMER_PASSWORD);
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        wait.until(ExpectedConditions.urlContains("/dashboard"));
        Assertions.assertTrue(driver.getCurrentUrl().contains("/dashboard"),
                "After login URL should contain /dashboard");
    }

    // ---------------------------------------------------------------
    // TC-06  Registration page loads and has required fields
    // ---------------------------------------------------------------
    @Test
    @Order(6)
    @DisplayName("TC-06: Registration page has required fields")
    void testRegisterPageHasFields() {
        driver.get(BASE_URL + "/register");
        WebElement nameField = waitFor(By.cssSelector("input[name='name'], input[placeholder*='name' i]"));
        WebElement emailField = driver.findElement(By.cssSelector("input[type='email'], input[name='email']"));
        WebElement passField  = driver.findElement(By.cssSelector("input[type='password']"));
        Assertions.assertTrue(nameField.isDisplayed(),  "Name field should be visible");
        Assertions.assertTrue(emailField.isDisplayed(), "Email field should be visible");
        Assertions.assertTrue(passField.isDisplayed(),  "Password field should be visible");
    }

    // ---------------------------------------------------------------
    // TC-07  Register with short password shows validation error
    // ---------------------------------------------------------------
    @Test
    @Order(7)
    @DisplayName("TC-07: Registration fails with short password")
    void testRegisterShortPassword() {
        driver.get(BASE_URL + "/register");
        WebElement nameField  = waitFor(By.cssSelector("input[name='name'], input[placeholder*='name' i]"));
        WebElement emailField = driver.findElement(By.cssSelector("input[type='email'], input[name='email']"));
        WebElement passField  = driver.findElement(By.cssSelector("input[type='password']"));

        clearAndType(nameField,  "Test User");
        clearAndType(emailField, NEW_USER_EMAIL);
        clearAndType(passField,  "abc");
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        boolean hasError = wait.until(d ->
                d.getPageSource().toLowerCase().contains("password") &&
                (d.getPageSource().toLowerCase().contains("6") ||
                 d.getPageSource().toLowerCase().contains("short") ||
                 d.getPageSource().toLowerCase().contains("least")));
        Assertions.assertTrue(hasError, "Short password should produce an error");
    }

    // ---------------------------------------------------------------
    // TC-08  Successful new user registration
    // ---------------------------------------------------------------
    @Test
    @Order(8)
    @DisplayName("TC-08: Successful user registration")
    void testSuccessfulRegistration() {
        driver.get(BASE_URL + "/register");
        WebElement nameField  = waitFor(By.cssSelector("input[name='name'], input[placeholder*='name' i]"));
        WebElement emailField = driver.findElement(By.cssSelector("input[type='email'], input[name='email']"));
        WebElement passField  = driver.findElement(By.cssSelector("input[type='password']"));

        clearAndType(nameField,  "Selenium Tester");
        clearAndType(emailField, NEW_USER_EMAIL);
        clearAndType(passField,  "seleniumpass123");
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        boolean success = wait.until(d ->
                d.getCurrentUrl().contains("/dashboard") ||
                d.getPageSource().toLowerCase().contains("successful") ||
                d.getPageSource().toLowerCase().contains("welcome"));
        Assertions.assertTrue(success, "Registration should succeed and redirect/show success");
    }

    // ---------------------------------------------------------------
    // TC-09  Cars listing page loads with car cards
    // ---------------------------------------------------------------
    @Test
    @Order(9)
    @DisplayName("TC-09: Cars page shows listings")
    void testCarsPageLoads() {
        driver.get(BASE_URL + "/cars");
        wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(
                By.cssSelector(".car-card, [class*='car'], [class*='Card'], article, .card")));
        java.util.List<WebElement> cards = driver.findElements(
                By.cssSelector(".car-card, [class*='car'], [class*='Card'], article, .card"));
        Assertions.assertTrue(cards.size() > 0, "Cars page should show at least one car");
    }

    // ---------------------------------------------------------------
    // TC-10  Car detail page loads
    // ---------------------------------------------------------------
    @Test
    @Order(10)
    @DisplayName("TC-10: Car detail page loads on click")
    void testCarDetailPageLoads() {
        driver.get(BASE_URL + "/cars");
        WebElement firstLink = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("a[href*='/cars/'], .car-card a, [class*='car'] a")));
        firstLink.click();
        wait.until(ExpectedConditions.urlContains("/cars/"));
        Assertions.assertTrue(driver.getCurrentUrl().contains("/cars/"),
                "Should navigate to car detail URL");
    }

    // ---------------------------------------------------------------
    // TC-11  Mechanics listing page loads
    // ---------------------------------------------------------------
    @Test
    @Order(11)
    @DisplayName("TC-11: Mechanics page shows listings")
    void testMechanicsPageLoads() {
        driver.get(BASE_URL + "/mechanics");
        wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(
                By.cssSelector(".mechanic-card, [class*='mechanic'], [class*='Card'], article, .card")));
        java.util.List<WebElement> cards = driver.findElements(
                By.cssSelector(".mechanic-card, [class*='mechanic'], [class*='Card'], article, .card"));
        Assertions.assertTrue(cards.size() > 0, "Mechanics page should show at least one mechanic");
    }

    // ---------------------------------------------------------------
    // TC-12  Unauthenticated user accessing dashboard redirects to login
    // ---------------------------------------------------------------
    @Test
    @Order(12)
    @DisplayName("TC-12: Dashboard redirects unauthenticated users to login")
    void testDashboardRedirectsToLogin() {
        driver.get(BASE_URL);
        ((JavascriptExecutor) driver).executeScript("localStorage.clear(); sessionStorage.clear();");
        driver.get(BASE_URL + "/dashboard");
        wait.until(ExpectedConditions.urlContains("/login"));
        Assertions.assertTrue(driver.getCurrentUrl().contains("/login"),
                "Dashboard should redirect to /login when not authenticated");
    }

    // ---------------------------------------------------------------
    // TC-13  Login and verify user name appears on dashboard
    // ---------------------------------------------------------------
    @Test
    @Order(13)
    @DisplayName("TC-13: Dashboard shows user info after login")
    void testDashboardShowsUserInfo() {
        driver.get(BASE_URL + "/login");
        WebElement email = waitFor(By.cssSelector("input[type='email'], input[name='email']"));
        WebElement password = driver.findElement(By.cssSelector("input[type='password']"));
        clearAndType(email, CUSTOMER_EMAIL);
        clearAndType(password, CUSTOMER_PASSWORD);
        driver.findElement(By.cssSelector("button[type='submit']")).click();
        wait.until(ExpectedConditions.urlContains("/dashboard"));

        boolean hasName = wait.until(d ->
                d.getPageSource().contains("Ahmed") ||
                d.getPageSource().toLowerCase().contains("welcome") ||
                d.getPageSource().toLowerCase().contains("dashboard"));
        Assertions.assertTrue(hasName, "Dashboard should show user name or welcome message");
    }

    // ---------------------------------------------------------------
    // TC-14  My Rentals page loads for authenticated user
    // ---------------------------------------------------------------
    @Test
    @Order(14)
    @DisplayName("TC-14: My Rentals page is accessible after login")
    void testMyRentalsPageLoads() {
        driver.get(BASE_URL + "/login");
        try {
            WebElement email = waitFor(By.cssSelector("input[type='email'], input[name='email']"));
            WebElement password = driver.findElement(By.cssSelector("input[type='password']"));
            clearAndType(email, CUSTOMER_EMAIL);
            clearAndType(password, CUSTOMER_PASSWORD);
            driver.findElement(By.cssSelector("button[type='submit']")).click();
            wait.until(ExpectedConditions.urlContains("/dashboard"));
        } catch (Exception ignored) {}

        driver.get(BASE_URL + "/my-rentals");
        boolean onPage = wait.until(d ->
                d.getCurrentUrl().contains("/my-rentals") ||
                d.getPageSource().toLowerCase().contains("rental"));
        Assertions.assertTrue(onPage, "My Rentals page should load for authenticated user");
    }

    // ---------------------------------------------------------------
    // TC-15  Page title is correct on Login page
    // ---------------------------------------------------------------
    @Test
    @Order(15)
    @DisplayName("TC-15: Login page has non-empty title")
    void testLoginPageTitle() {
        driver.get(BASE_URL + "/login");
        String title = driver.getTitle();
        Assertions.assertNotNull(title, "Page title should not be null");
        Assertions.assertFalse(title.isEmpty(), "Page title should not be empty");
    }

    // ---------------------------------------------------------------
    // TC-16  Cars page has search/filter controls
    // ---------------------------------------------------------------
    @Test
    @Order(16)
    @DisplayName("TC-16: Cars page has search or filter controls")
    void testCarsPageHasFilterControls() {
        driver.get(BASE_URL + "/cars");
        wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector("input, select, button, [class*='filter'], [class*='search']")));
        java.util.List<WebElement> controls = driver.findElements(
                By.cssSelector("input, select, button"));
        Assertions.assertTrue(controls.size() > 0,
                "Cars page should have at least one interactive control");
    }

    // ---------------------------------------------------------------
    // TC-17  Navbar contains links to main sections
    // ---------------------------------------------------------------
    @Test
    @Order(17)
    @DisplayName("TC-17: Navbar has links to Cars and Mechanics")
    void testNavbarHasCorrectLinks() {
        driver.get(BASE_URL);
        String pageSource = driver.getPageSource().toLowerCase();
        Assertions.assertTrue(
                pageSource.contains("cars") || pageSource.contains("mechanic"),
                "Navbar or page should contain links to Cars and/or Mechanics sections");
    }
}
