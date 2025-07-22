import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComplaintModal from '../ComplaintModal';

describe('ComplaintModal', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    test('renders modal when isOpen is true', () => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      expect(screen.getByText('Подать жалобу')).toBeInTheDocument();
      expect(screen.getByText('Test Operator')).toBeInTheDocument();
    });

    test('does not render modal when isOpen is false', () => {
      render(
        <ComplaintModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      expect(screen.queryByText('Подать жалобу')).not.toBeInTheDocument();
    });
  });

  describe('Complaint Reason Selection', () => {
    beforeEach(() => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('displays complaint reason options', () => {
      expect(screen.getByText('Грубое поведение')).toBeInTheDocument();
      expect(screen.getByText('Некомпетентность')).toBeInTheDocument();
      expect(screen.getByText('Долгое время ответа')).toBeInTheDocument();
      expect(screen.getByText('Неправильная информация')).toBeInTheDocument();
      expect(screen.getByText('Другое')).toBeInTheDocument();
    });

    test('allows selecting reason', async () => {
      const reasonOption = screen.getByLabelText('Грубое поведение');
      await user.click(reasonOption);

      expect(reasonOption).toBeChecked();
    });

    test('allows selecting only one reason at a time', async () => {
      const reasonOne = screen.getByLabelText('Грубое поведение');
      const reasonTwo = screen.getByLabelText('Некомпетентность');

      await user.click(reasonOne);
      await user.click(reasonTwo);

      expect(reasonOne).not.toBeChecked();
      expect(reasonTwo).toBeChecked();
    });

    test('shows custom reason input when "Другое" is selected', async () => {
      const otherOption = screen.getByLabelText('Другое');
      await user.click(otherOption);

      expect(screen.getByPlaceholderText('Укажите причину')).toBeInTheDocument();
    });
  });

  describe('Details Input', () => {
    beforeEach(() => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('allows entering complaint details', async () => {
      const detailsInput = screen.getByPlaceholderText(/опишите подробности/i);
      
      await user.type(detailsInput, 'Детали жалобы');
      
      expect(detailsInput).toHaveValue('Детали жалобы');
    });

    test('has character limit for details', async () => {
      const detailsInput = screen.getByPlaceholderText(/опишите подробности/i);
      const longDetails = 'x'.repeat(1000);
      
      await user.type(detailsInput, longDetails);
      
      // Assuming there's a character limit of 500
      expect(detailsInput.value.length).toBeLessThanOrEqual(500);
    });

    test('shows character count', async () => {
      const detailsInput = screen.getByPlaceholderText(/опишите подробности/i);
      
      await user.type(detailsInput, 'Тестовый текст');
      
      expect(screen.getByText(/символов/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('disables submit button when no reason selected', () => {
      const submitButton = screen.getByText('Отправить жалобу');
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when reason is selected', async () => {
      const reasonOption = screen.getByLabelText('Грубое поведение');
      const submitButton = screen.getByText('Отправить жалобу');

      await user.click(reasonOption);

      expect(submitButton).not.toBeDisabled();
    });

    test('requires custom reason when "Другое" is selected', async () => {
      const otherOption = screen.getByLabelText('Другое');
      const submitButton = screen.getByText('Отправить жалобу');

      await user.click(otherOption);

      expect(submitButton).toBeDisabled();

      const customReasonInput = screen.getByPlaceholderText('Укажите причину');
      await user.type(customReasonInput, 'Моя причина');

      expect(submitButton).not.toBeDisabled();
    });

    test('validates minimum details length', async () => {
      const reasonOption = screen.getByLabelText('Грубое поведение');
      const detailsInput = screen.getByPlaceholderText(/опишите подробности/i);
      const submitButton = screen.getByText('Отправить жалобу');

      await user.click(reasonOption);
      await user.type(detailsInput, 'xx'); // Too short

      expect(submitButton).toBeDisabled();

      await user.clear(detailsInput);
      await user.type(detailsInput, 'Достаточно длинное описание');

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('submits complaint with predefined reason', async () => {
      const reasonOption = screen.getByLabelText('Грубое поведение');
      const detailsInput = screen.getByPlaceholderText(/опишите подробности/i);
      const submitButton = screen.getByText('Отправить жалобу');

      await user.click(reasonOption);
      await user.type(detailsInput, 'Подробности жалобы');
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('Грубое поведение', 'Подробности жалобы');
    });

    test('submits complaint with custom reason', async () => {
      const otherOption = screen.getByLabelText('Другое');
      const customReasonInput = screen.getByPlaceholderText('Укажите причину');
      const detailsInput = screen.getByPlaceholderText(/опишите подробности/i);
      const submitButton = screen.getByText('Отправить жалобу');

      await user.click(otherOption);
      await user.type(customReasonInput, 'Моя причина');
      await user.type(detailsInput, 'Подробности жалобы');
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('Моя причина', 'Подробности жалобы');
    });

    test('submits complaint with reason only (no details)', async () => {
      const reasonOption = screen.getByLabelText('Некомпетентность');
      const submitButton = screen.getByText('Отправить жалобу');

      await user.click(reasonOption);
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('Некомпетентность', '');
    });
  });

  describe('Modal Actions', () => {
    beforeEach(() => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('calls onClose when close button is clicked', async () => {
      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when cancel button is clicked', async () => {
      const cancelButton = screen.getByText('Отмена');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when overlay is clicked', async () => {
      const overlay = screen.getByTestId('modal-overlay');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('closes modal when Escape key is pressed', async () => {
      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('allows navigation through reason options with arrow keys', async () => {
      const firstReason = screen.getByLabelText('Грубое поведение');
      firstReason.focus();

      await user.keyboard('{ArrowDown}');
      expect(screen.getByLabelText('Некомпетентность')).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      expect(screen.getByLabelText('Долгое время ответа')).toHaveFocus();
    });

    test('allows selecting reason with Space key', async () => {
      const reasonOption = screen.getByLabelText('Грубое поведение');
      reasonOption.focus();

      await user.keyboard(' ');
      expect(reasonOption).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('has proper ARIA attributes', () => {
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    test('has proper form labels', () => {
      const detailsInput = screen.getByLabelText(/подробности/i);
      expect(detailsInput).toBeInTheDocument();
    });

    test('has proper radio button group', () => {
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-labelledby');
    });

    test('announces form errors to screen readers', async () => {
      const submitButton = screen.getByText('Отправить жалобу');
      
      // Try to submit without selecting reason
      await user.click(submitButton);
      
      expect(screen.getByRole('alert')).toHaveTextContent(/выберите причину/i);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('shows error message when no reason is selected', async () => {
      const submitButton = screen.getByText('Отправить жалобу');
      
      await user.click(submitButton);
      
      expect(screen.getByText(/выберите причину жалобы/i)).toBeInTheDocument();
    });

    test('shows error message for empty custom reason', async () => {
      const otherOption = screen.getByLabelText('Другое');
      const submitButton = screen.getByText('Отправить жалобу');

      await user.click(otherOption);
      await user.click(submitButton);

      expect(screen.getByText(/укажите причину жалобы/i)).toBeInTheDocument();
    });

    test('clears errors when valid input is provided', async () => {
      const otherOption = screen.getByLabelText('Другое');
      const customReasonInput = screen.getByPlaceholderText('Укажите причину');
      const submitButton = screen.getByText('Отправить жалобу');

      await user.click(otherOption);
      await user.click(submitButton); // This should show error

      expect(screen.getByText(/укажите причину жалобы/i)).toBeInTheDocument();

      await user.type(customReasonInput, 'Моя причина');

      expect(screen.queryByText(/укажите причину жалобы/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing operator name gracefully', () => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName=""
        />
      );

      expect(screen.getByText('Подать жалобу')).toBeInTheDocument();
    });

    test('prevents double submission', async () => {
      render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      const reasonOption = screen.getByLabelText('Грубое поведение');
      const submitButton = screen.getByText('Отправить жалобу');

      await user.click(reasonOption);
      await user.click(submitButton);
      await user.click(submitButton); // Second click

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    test('resets form when modal is reopened', async () => {
      const { rerender } = render(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      const reasonOption = screen.getByLabelText('Грубое поведение');
      await user.click(reasonOption);

      // Close modal
      rerender(
        <ComplaintModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      // Reopen modal
      rerender(
        <ComplaintModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      // Form should be reset
      expect(screen.getByText('Отправить жалобу')).toBeDisabled();
      expect(reasonOption).not.toBeChecked();
    });
  });
});