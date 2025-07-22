import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatingModal from '../RatingModal';

describe('RatingModal', () => {
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
        <RatingModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      expect(screen.getByText('Оценить оператора')).toBeInTheDocument();
      expect(screen.getByText('Test Operator')).toBeInTheDocument();
    });

    test('does not render modal when isOpen is false', () => {
      render(
        <RatingModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      expect(screen.queryByText('Оценить оператора')).not.toBeInTheDocument();
    });
  });

  describe('Star Rating', () => {
    beforeEach(() => {
      render(
        <RatingModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('displays 5 star buttons', () => {
      const stars = screen.getAllByRole('button').filter(button => 
        button.getAttribute('aria-label')?.includes('звезд')
      );
      expect(stars).toHaveLength(5);
    });

    test('allows selecting star rating', async () => {
      const threeStar = screen.getByLabelText('3 звезды');
      await user.click(threeStar);

      // Check if 3 stars are highlighted (you might need to check specific classes or attributes)
      expect(threeStar).toHaveAttribute('data-selected', 'true');
    });

    test('highlights stars on hover', async () => {
      const fourStar = screen.getByLabelText('4 звезды');
      await user.hover(fourStar);

      // Verify hover state is applied
      expect(fourStar).toHaveClass('hover');
    });

    test('allows changing rating selection', async () => {
      const threeStar = screen.getByLabelText('3 звезды');
      const fiveStar = screen.getByLabelText('5 звезд');

      await user.click(threeStar);
      await user.click(fiveStar);

      expect(fiveStar).toHaveAttribute('data-selected', 'true');
      expect(threeStar).not.toHaveAttribute('data-selected', 'true');
    });
  });

  describe('Comment Input', () => {
    beforeEach(() => {
      render(
        <RatingModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('allows entering optional comment', async () => {
      const commentInput = screen.getByPlaceholderText(/дополнительный комментарий/i);
      
      await user.type(commentInput, 'Отличная работа!');
      
      expect(commentInput).toHaveValue('Отличная работа!');
    });

    test('has character limit for comment', async () => {
      const commentInput = screen.getByPlaceholderText(/дополнительный комментарий/i);
      const longComment = 'x'.repeat(500);
      
      await user.type(commentInput, longComment);
      
      // Assuming there's a character limit of 250
      expect(commentInput.value.length).toBeLessThanOrEqual(250);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      render(
        <RatingModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('submits rating without comment', async () => {
      const fourStar = screen.getByLabelText('4 звезды');
      const submitButton = screen.getByText('Отправить оценку');

      await user.click(fourStar);
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(4, '');
    });

    test('submits rating with comment', async () => {
      const fiveStar = screen.getByLabelText('5 звезд');
      const commentInput = screen.getByPlaceholderText(/дополнительный комментарий/i);
      const submitButton = screen.getByText('Отправить оценку');

      await user.click(fiveStar);
      await user.type(commentInput, 'Превосходная работа!');
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(5, 'Превосходная работа!');
    });

    test('disables submit button when no rating selected', () => {
      const submitButton = screen.getByText('Отправить оценку');
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when rating is selected', async () => {
      const threeStar = screen.getByLabelText('3 звезды');
      const submitButton = screen.getByText('Отправить оценку');

      await user.click(threeStar);

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Modal Actions', () => {
    beforeEach(() => {
      render(
        <RatingModal
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
        <RatingModal
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

    test('allows navigation through stars with arrow keys', async () => {
      const firstStar = screen.getByLabelText('1 звезда');
      firstStar.focus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByLabelText('2 звезды')).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByLabelText('3 звезды')).toHaveFocus();
    });

    test('allows selecting star with Enter key', async () => {
      const threeStar = screen.getByLabelText('3 звезды');
      threeStar.focus();

      await user.keyboard('{Enter}');
      expect(threeStar).toHaveAttribute('data-selected', 'true');
    });

    test('allows selecting star with Space key', async () => {
      const fourStar = screen.getByLabelText('4 звезды');
      fourStar.focus();

      await user.keyboard(' ');
      expect(fourStar).toHaveAttribute('data-selected', 'true');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(
        <RatingModal
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

    test('has proper ARIA labels for stars', () => {
      for (let i = 1; i <= 5; i++) {
        const star = screen.getByLabelText(`${i} звезд${i === 1 ? 'а' : i < 5 ? 'ы' : ''}`);
        expect(star).toHaveAttribute('role', 'button');
        expect(star).toHaveAttribute('tabindex', '0');
      }
    });

    test('announces current rating to screen readers', async () => {
      const threeStar = screen.getByLabelText('3 звезды');
      await user.click(threeStar);

      expect(screen.getByLiveRegion()).toHaveTextContent('Выбрано 3 звезды');
    });

    test('has proper form labels', () => {
      const commentInput = screen.getByLabelText(/комментарий/i);
      expect(commentInput).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    beforeEach(() => {
      render(
        <RatingModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );
    });

    test('shows visual feedback for selected rating', async () => {
      const fourStar = screen.getByLabelText('4 звезды');
      await user.click(fourStar);

      // Check if all stars up to 4 are highlighted
      for (let i = 1; i <= 4; i++) {
        const star = screen.getByLabelText(`${i} звезд${i === 1 ? 'а' : i < 5 ? 'ы' : ''}`);
        expect(star).toHaveClass('selected');
      }

      // Check if 5th star is not highlighted
      const fifthStar = screen.getByLabelText('5 звезд');
      expect(fifthStar).not.toHaveClass('selected');
    });

    test('shows hover effect on stars', async () => {
      const threeStar = screen.getByLabelText('3 звезды');
      
      await user.hover(threeStar);
      
      // Stars 1-3 should show hover effect
      for (let i = 1; i <= 3; i++) {
        const star = screen.getByLabelText(`${i} звезд${i === 1 ? 'а' : i < 5 ? 'ы' : ''}`);
        expect(star).toHaveClass('hover');
      }
    });
  });

  describe('Edge Cases', () => {
    test('handles missing operator name gracefully', () => {
      render(
        <RatingModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName=""
        />
      );

      expect(screen.getByText('Оценить оператора')).toBeInTheDocument();
    });

    test('prevents double submission', async () => {
      render(
        <RatingModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      const threeStar = screen.getByLabelText('3 звезды');
      const submitButton = screen.getByText('Отправить оценку');

      await user.click(threeStar);
      await user.click(submitButton);
      await user.click(submitButton); // Second click

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    test('resets form when modal is reopened', async () => {
      const { rerender } = render(
        <RatingModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      const threeStar = screen.getByLabelText('3 звезды');
      await user.click(threeStar);

      // Close modal
      rerender(
        <RatingModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      // Reopen modal
      rerender(
        <RatingModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operatorName="Test Operator"
        />
      );

      // Form should be reset
      expect(screen.getByText('Отправить оценку')).toBeDisabled();
    });
  });
});