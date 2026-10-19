
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/vitest";
import App from "../App";

describe("Reflex Rush", () => {
  it("shows the game title", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /reflex rush/i })
    ).toBeInTheDocument();
  });

  it("shows the Start Practice button", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: /start practice/i })
    ).toBeInTheDocument();
  });
});
