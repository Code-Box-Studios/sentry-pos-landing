import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "./alert";
import { Badge } from "./badge";
import { Button } from "./button";
import { Field } from "./field";
import { Input } from "./input";
import { Select } from "./select";

describe("Button", () => {
  it("is a submit button when asked, so a form posts on Enter", () => {
    render(<Button type="submit">Sign in</Button>);
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit");
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Cancel</Button>);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute("type", "button");
  });

  it("keeps a caller's classes alongside its own", () => {
    render(<Button className="w-full">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("w-full");
  });
});

describe("Field", () => {
  it("labels the control, so clicking the label focuses the input", () => {
    render(
      <Field name="email" label="Email address">
        <Input name="email" />
      </Field>,
    );
    expect(screen.getByLabelText("Email address")).toBe(screen.getByRole("textbox"));
  });

  it("announces an error and marks the control invalid", () => {
    render(
      <Field name="email" label="Email address" error="email must be an email">
        <Input name="email" />
      </Field>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("email must be an email");
    expect(screen.getByRole("alert")).toHaveTextContent("email must be an email");
  });

  it("shows a hint when there is no error, and hides it once there is one", () => {
    const { rerender } = render(
      <Field name="pin" label="Refund PIN" hint="Six digits.">
        <Input name="pin" />
      </Field>,
    );
    expect(screen.getByText("Six digits.")).toBeInTheDocument();

    rerender(
      <Field name="pin" label="Refund PIN" hint="Six digits." error="pin is too short">
        <Input name="pin" />
      </Field>,
    );
    expect(screen.queryByText("Six digits.")).not.toBeInTheDocument();
  });
});

describe("Alert", () => {
  it("is announced to assistive tech", () => {
    render(<Alert tone="danger">Something went wrong.</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong.");
  });
});

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge tone="danger">suspended</Badge>);
    expect(screen.getByText("suspended")).toBeInTheDocument();
  });
});

describe("Select", () => {
  it("renders its options and reports the chosen value", () => {
    render(
      <Select aria-label="Business" defaultValue="b-2">
        <option value="b-1">One</option>
        <option value="b-2">Two</option>
      </Select>,
    );
    expect(screen.getByLabelText("Business")).toHaveValue("b-2");
  });

  it("marks itself invalid for the same styling the inputs use", () => {
    render(<Select aria-label="Business" aria-invalid="true" />);
    expect(screen.getByLabelText("Business")).toHaveAttribute("aria-invalid", "true");
  });
});
