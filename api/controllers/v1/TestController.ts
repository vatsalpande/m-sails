class TestController {
  public static test(req, res) {
    return res.json({
      value: 1
    });
  }
}

export = TestController;
