import { renderHook, act } from '@testing-library/react';
import { useFormState } from '../useFormState';

describe('useFormState Hook', () => {
  const initialValues = {
    name: '',
    email: '',
    age: 0
  };

  it('initializes with provided values', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('sets field values', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    act(() => {
      result.current.setValue('name', 'John Doe');
      result.current.setValue('email', 'john@example.com');
      result.current.setValue('age', 25);
    });
    
    expect(result.current.values).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    });
  });

  it('sets field errors', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    act(() => {
      result.current.setFieldError('name', 'Name is required');
      result.current.setFieldError('email', 'Invalid email format');
    });
    
    expect(result.current.errors).toEqual({
      name: 'Name is required',
      email: 'Invalid email format'
    });
  });

  it('sets field touched state', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    act(() => {
      result.current.setFieldTouched('name');
      result.current.setFieldTouched('email', true);
      result.current.setFieldTouched('age', false);
    });
    
    expect(result.current.touched).toEqual({
      name: true,
      email: true,
      age: false
    });
  });

  it('clears error when setting value for field with error', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    act(() => {
      result.current.setFieldError('name', 'Name is required');
    });
    
    expect(result.current.errors.name).toBe('Name is required');
    
    act(() => {
      result.current.setValue('name', 'John');
    });
    
    expect(result.current.errors.name).toBeUndefined();
  });

  it('sets all errors at once', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    const allErrors = {
      name: 'Name is required',
      email: 'Email is required',
      age: 'Age must be positive'
    };
    
    act(() => {
      result.current.setAllErrors(allErrors);
    });
    
    expect(result.current.errors).toEqual(allErrors);
  });

  it('clears all errors', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    act(() => {
      result.current.setAllErrors({
        name: 'Name is required',
        email: 'Email is required'
      });
    });
    
    expect(Object.keys(result.current.errors)).toHaveLength(2);
    
    act(() => {
      result.current.clearErrors();
    });
    
    expect(result.current.errors).toEqual({});
  });

  it('resets form to initial state', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    act(() => {
      result.current.setValue('name', 'John');
      result.current.setFieldError('email', 'Required');
      result.current.setFieldTouched('name');
    });
    
    expect(result.current.values.name).toBe('John');
    expect(result.current.errors.email).toBe('Required');
    expect(result.current.touched.name).toBe(true);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('handles change events', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    const mockEvent = {
      target: {
        value: 'John Doe'
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    act(() => {
      result.current.handleChange('name')(mockEvent);
    });
    
    expect(result.current.values.name).toBe('John Doe');
  });

  it('handles blur events', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    act(() => {
      result.current.handleBlur('name')();
    });
    
    expect(result.current.touched.name).toBe(true);
  });

  it('checks if field is invalid', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    // Field is not invalid initially
    expect(result.current.isFieldInvalid('name')).toBe(false);
    
    // Field is not invalid with error but not touched
    act(() => {
      result.current.setFieldError('name', 'Required');
    });
    
    expect(result.current.isFieldInvalid('name')).toBe(false);
    
    // Field is invalid with error and touched
    act(() => {
      result.current.setFieldTouched('name');
    });
    
    expect(result.current.isFieldInvalid('name')).toBe(true);
  });

  it('checks if form is valid', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    // Form is valid initially
    expect(result.current.isFormValid()).toBe(true);
    
    // Form is invalid with errors
    act(() => {
      result.current.setFieldError('name', 'Required');
    });
    
    expect(result.current.isFormValid()).toBe(false);
    
    // Form is valid when errors are cleared
    act(() => {
      result.current.clearErrors();
    });
    
    expect(result.current.isFormValid()).toBe(true);
  });

  it('handles complex form state changes', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    // Set values and touch fields
    act(() => {
      result.current.setValue('name', 'John');
      result.current.setValue('email', 'john@example.com');
      result.current.setFieldTouched('name');
      result.current.setFieldTouched('email');
    });
    
    // Add error to name field
    act(() => {
      result.current.setFieldError('name', 'Name is too short');
    });
    
    expect(result.current.isFieldInvalid('name')).toBe(true);
    expect(result.current.isFieldInvalid('email')).toBe(false);
    expect(result.current.isFormValid()).toBe(false);
    
    // Fix the error by updating the value
    act(() => {
      result.current.setValue('name', 'John Doe');
    });
    
    expect(result.current.isFieldInvalid('name')).toBe(false);
    expect(result.current.isFormValid()).toBe(true);
  });

  it('handles different input types in change handler', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    // Test with select element
    const selectEvent = {
      target: {
        value: 'selected@example.com'
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    act(() => {
      result.current.handleChange('email')(selectEvent);
    });
    
    expect(result.current.values.email).toBe('selected@example.com');
    
    // Test with textarea element
    const textareaEvent = {
      target: {
        value: 'Long text content'
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    act(() => {
      result.current.handleChange('name')(textareaEvent);
    });
    
    expect(result.current.values.name).toBe('Long text content');
  });

  it('preserves other values when setting individual field', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    act(() => {
      result.current.setValue('name', 'John');
      result.current.setValue('email', 'john@example.com');
      result.current.setValue('age', 25);
    });
    
    act(() => {
      result.current.setValue('name', 'Jane');
    });
    
    expect(result.current.values).toEqual({
      name: 'Jane',
      email: 'john@example.com',
      age: 25
    });
  });

  it('handles numeric values correctly', () => {
    const { result } = renderHook(() => useFormState(initialValues));
    
    act(() => {
      result.current.setValue('age', 30);
    });
    
    expect(result.current.values.age).toBe(30);
    expect(typeof result.current.values.age).toBe('number');
  });

  it('handles boolean values in form state', () => {
    const booleanForm = {
      isActive: false,
      isAdmin: true
    };
    
    const { result } = renderHook(() => useFormState(booleanForm));
    
    act(() => {
      result.current.setValue('isActive', true);
    });
    
    expect(result.current.values.isActive).toBe(true);
    expect(result.current.values.isAdmin).toBe(true);
  });
});