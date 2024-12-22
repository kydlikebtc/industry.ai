describe('Basic Infrastructure Test', () => {
  test('Test environment is working', () => {
    expect(true).toBe(true);
  });

  test('Math operations work', () => {
    expect(1 + 1).toBe(2);
  });

  test('String operations work', () => {
    expect('hello'.length).toBe(5);
  });
});
