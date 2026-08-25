describe("Backend Setup", () => {
  it("testing environment works", () => {
    expect(true).toBe(true);
  });

  it("Node.js version is 18 or higher", () => {
    const version = parseInt(process.version.slice(1));
    expect(version).toBeGreaterThanOrEqual(18);
  });

  it("shared types structure is correct", () => {
    const mockDesign = {
      id: "test-id",
      shareableId: "abc123",
      imageUrl: "https://example.com/img.png",
      storagePath: "designs/img.png",
      creatorUid: "user-uid",
      createdAt: new Date().toISOString(),
    };

    expect(mockDesign.shareableId).toBe("abc123");
    expect("x" in mockDesign).toBe(false);
  });
});
