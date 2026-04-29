import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { render } from "@/test/render";
import ErrorAlert from "./ErrorAlert";

describe("ErrorAlert", () => {
  it("renders the provided message", () => {
    render(<ErrorAlert message="Something failed." />);
    expect(screen.getByText("Something failed.")).toBeInTheDocument();
  });

  it("renders default title when title prop is omitted", () => {
    render(<ErrorAlert message="Any message" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(<ErrorAlert title="Failed to load ticket" message="Any message" />);
    expect(screen.getByText("Failed to load ticket")).toBeInTheDocument();
  });

  it("renders both title and message together", () => {
    render(<ErrorAlert title="Network error" message="Please retry." />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.getByText("Please retry.")).toBeInTheDocument();
  });
});