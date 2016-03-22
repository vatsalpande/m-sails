class TestController {
  public static test(req, res) {
    return res.json({
      value: 2
    });
  }
}

export = TestController;
