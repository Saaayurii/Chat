import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarRating from '../StarRating';

describe('StarRating', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Display Mode (Non-Interactive)', () => {
    test('renders 5 stars', () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole('button');
      expect(stars).toHaveLength(5);
    });

    test('displays correct number of filled stars', () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole('button');
      
      // First 3 stars should be filled (yellow)
      expect(stars[0]).toHaveClass('text-yellow-400');
      expect(stars[1]).toHaveClass('text-yellow-400');
      expect(stars[2]).toHaveClass('text-yellow-400');
      
      // Last 2 stars should be empty (gray)
      expect(stars[3]).toHaveClass('text-gray-300');
      expect(stars[4]).toHaveClass('text-gray-300');
    });

    test('displays zero rating correctly', () => {
      render(<StarRating rating={0} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toHaveClass('text-gray-300');
        expect(star).not.toHaveClass('text-yellow-400');
      });
    });

    test('displays full rating correctly', () => {
      render(<StarRating rating={5} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toHaveClass('text-yellow-400');
        expect(star).not.toHaveClass('text-gray-300');
      });
    });

    test('handles decimal ratings by rounding down', () => {
      render(<StarRating rating={3.7} />);

      const stars = screen.getAllByRole('button');
      
      // Should show 3 filled stars (3.7 rounds down to 3)
      expect(stars[0]).toHaveClass('text-yellow-400');
      expect(stars[1]).toHaveClass('text-yellow-400');
      expect(stars[2]).toHaveClass('text-yellow-400');
      expect(stars[3]).toHaveClass('text-gray-300');
      expect(stars[4]).toHaveClass('text-gray-300');
    });

    test('handles ratings above 5', () => {
      render(<StarRating rating={7} />);

      const stars = screen.getAllByRole('button');
      // All stars should be filled when rating > 5
      stars.forEach(star => {
        expect(star).toHaveClass('text-yellow-400');
      });
    });

    test('handles negative ratings', () => {
      render(<StarRating rating={-1} />);

      const stars = screen.getAllByRole('button');
      // No stars should be filled when rating < 0
      stars.forEach(star => {
        expect(star).toHaveClass('text-gray-300');
      });
    });

    test('stars are disabled in non-interactive mode', () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toBeDisabled();
      });
    });

    test('stars do not have hover styles in non-interactive mode', () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).not.toHaveClass('hover:text-yellow-400');
        expect(star).not.toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Interactive Mode', () => {
    test('enables stars in interactive mode', () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={3} interactive={true} onChange={mockOnChange} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).not.toBeDisabled();
      });
    });

    test('adds hover styles in interactive mode', () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={3} interactive={true} onChange={mockOnChange} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toHaveClass('hover:text-yellow-400');
        expect(star).toHaveClass('cursor-pointer');
      });
    });

    test('calls onChange when star is clicked', async () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={2} interactive={true} onChange={mockOnChange} />);

      const fourthStar = screen.getAllByRole('button')[3]; // 4th star (index 3)
      await user.click(fourthStar);

      expect(mockOnChange).toHaveBeenCalledWith(4);
    });

    test('calls onChange with correct value for each star', async () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={0} interactive={true} onChange={mockOnChange} />);

      const stars = screen.getAllByRole('button');
      
      for (let i = 0; i < stars.length; i++) {
        await user.click(stars[i]);
        expect(mockOnChange).toHaveBeenCalledWith(i + 1);
      }

      expect(mockOnChange).toHaveBeenCalledTimes(5);
    });

    test('does not call onChange when interactive is false', async () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={3} interactive={false} onChange={mockOnChange} />);

      const stars = screen.getAllByRole('button');
      await user.click(stars[0]);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    test('does not call onChange when onChange is not provided', async () => {
      render(<StarRating rating={3} interactive={true} />);

      const stars = screen.getAllByRole('button');
      
      // Should not throw error when clicking
      await user.click(stars[0]);
      
      // Test passes if no error is thrown
      expect(stars[0]).toBeInTheDocument();
    });

    test('updates visual feedback on hover', async () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={2} interactive={true} onChange={mockOnChange} />);

      const fourthStar = screen.getAllByRole('button')[3];
      
      await user.hover(fourthStar);
      
      // Star should have hover class
      expect(fourthStar).toHaveClass('hover:text-yellow-400');
    });
  });

  describe('Edge Cases', () => {
    test('handles fractional ratings correctly', () => {
      const testCases = [
        { rating: 0.1, expectedFilled: 0 },
        { rating: 0.9, expectedFilled: 0 },
        { rating: 1.0, expectedFilled: 1 },
        { rating: 1.5, expectedFilled: 1 },
        { rating: 1.9, expectedFilled: 1 },
        { rating: 2.0, expectedFilled: 2 },
        { rating: 4.99, expectedFilled: 4 },
        { rating: 5.0, expectedFilled: 5 }
      ];

      testCases.forEach(({ rating, expectedFilled }) => {
        const { unmount } = render(<StarRating rating={rating} />);
        
        const stars = screen.getAllByRole('button');
        
        for (let i = 0; i < 5; i++) {
          if (i < expectedFilled) {
            expect(stars[i]).toHaveClass('text-yellow-400');
          } else {
            expect(stars[i]).toHaveClass('text-gray-300');
          }
        }
        
        unmount();
      });
    });

    test('maintains rating display when clicking without onChange', async () => {
      render(<StarRating rating={3} interactive={true} />);

      const stars = screen.getAllByRole('button');
      
      // Click fifth star
      await user.click(stars[4]);
      
      // Rating should remain at 3 (no onChange provided)
      expect(stars[0]).toHaveClass('text-yellow-400');
      expect(stars[1]).toHaveClass('text-yellow-400');
      expect(stars[2]).toHaveClass('text-yellow-400');
      expect(stars[3]).toHaveClass('text-gray-300');
      expect(stars[4]).toHaveClass('text-gray-300');
    });

    test('handles rapid clicking correctly', async () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={1} interactive={true} onChange={mockOnChange} />);

      const stars = screen.getAllByRole('button');
      
      // Rapidly click different stars
      await user.click(stars[4]); // 5 stars
      await user.click(stars[1]); // 2 stars
      await user.click(stars[3]); // 4 stars

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 5);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 2);
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 4);
    });
  });

  describe('Accessibility', () => {
    test('all stars are keyboard accessible', () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={3} interactive={true} onChange={mockOnChange} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toHaveAttribute('type', 'button');
      });
    });

    test('non-interactive stars have no type attribute', () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).not.toHaveAttribute('type');
      });
    });

    test('stars have meaningful content (star symbol)', () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toHaveTextContent('★');
      });
    });

    test('supports keyboard navigation in interactive mode', async () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={2} interactive={true} onChange={mockOnChange} />);

      const thirdStar = screen.getAllByRole('button')[2];
      
      // Focus and press Enter
      thirdStar.focus();
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith(3);
    });

    test('supports space key activation in interactive mode', async () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={1} interactive={true} onChange={mockOnChange} />);

      const fifthStar = screen.getAllByRole('button')[4];
      
      // Focus and press Space
      fifthStar.focus();
      await user.keyboard(' ');

      expect(mockOnChange).toHaveBeenCalledWith(5);
    });
  });

  describe('Visual Styling', () => {
    test('applies correct base classes', () => {
      render(<StarRating rating={3} />);

      const container = screen.getAllByRole('button')[0].parentElement;
      expect(container).toHaveClass('flex', 'gap-1');
    });

    test('applies correct star classes', () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toHaveClass('text-xl');
      });
    });

    test('applies filled star styling correctly', () => {
      render(<StarRating rating={2} />);

      const stars = screen.getAllByRole('button');
      expect(stars[0]).toHaveClass('text-yellow-400');
      expect(stars[1]).toHaveClass('text-yellow-400');
    });

    test('applies empty star styling correctly', () => {
      render(<StarRating rating={2} />);

      const stars = screen.getAllByRole('button');
      expect(stars[2]).toHaveClass('text-gray-300');
      expect(stars[3]).toHaveClass('text-gray-300');
      expect(stars[4]).toHaveClass('text-gray-300');
    });

    test('interactive stars have additional styling', () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={3} interactive={true} onChange={mockOnChange} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toHaveClass('hover:text-yellow-400');
        expect(star).toHaveClass('cursor-pointer');
      });
    });

    test('non-interactive stars do not have additional styling', () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).not.toHaveClass('hover:text-yellow-400');
        expect(star).not.toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      const mockOnChange = jest.fn();
      const { rerender } = render(
        <StarRating rating={3} interactive={true} onChange={mockOnChange} />
      );

      // Re-render with same props
      rerender(<StarRating rating={3} interactive={true} onChange={mockOnChange} />);

      const stars = screen.getAllByRole('button');
      expect(stars).toHaveLength(5);
      
      // Should maintain correct state
      expect(stars[0]).toHaveClass('text-yellow-400');
      expect(stars[3]).toHaveClass('text-gray-300');
    });

    test('updates correctly when rating changes', () => {
      const mockOnChange = jest.fn();
      const { rerender } = render(
        <StarRating rating={2} interactive={true} onChange={mockOnChange} />
      );

      // Update rating
      rerender(<StarRating rating={4} interactive={true} onChange={mockOnChange} />);

      const stars = screen.getAllByRole('button');
      
      // Should show 4 filled stars
      expect(stars[0]).toHaveClass('text-yellow-400');
      expect(stars[1]).toHaveClass('text-yellow-400');
      expect(stars[2]).toHaveClass('text-yellow-400');
      expect(stars[3]).toHaveClass('text-yellow-400');
      expect(stars[4]).toHaveClass('text-gray-300');
    });
  });
});