/**
 * Unit tests for utils.ts - cn() utility function
 * 
 * Tests cover:
 * - Class merging
 * - Tailwind conflict resolution
 * - Conditional classes
 * - Undefined/null handling
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn() utility function', () => {
  describe('Basic Class Merging', () => {
    it('should merge multiple class strings', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle single class string', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('should handle empty call', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should merge array of classes', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toBe('class1 class2');
    });

    it('should merge mixed strings and arrays', () => {
      const result = cn('class1', ['class2', 'class3'], 'class4');
      expect(result).toBe('class1 class2 class3 class4');
    });
  });

  describe('Tailwind Conflict Resolution', () => {
    it('should resolve conflicting padding classes (last wins)', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('should resolve conflicting margin classes', () => {
      const result = cn('m-2', 'm-4', 'm-6');
      expect(result).toBe('m-6');
    });

    it('should resolve conflicting text color classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('should resolve conflicting background color classes', () => {
      const result = cn('bg-white', 'bg-black', 'bg-gray-100');
      expect(result).toBe('bg-gray-100');
    });

    it('should resolve conflicting width classes', () => {
      const result = cn('w-full', 'w-1/2', 'w-auto');
      expect(result).toBe('w-auto');
    });

    it('should resolve conflicting height classes', () => {
      const result = cn('h-screen', 'h-full', 'h-auto');
      expect(result).toBe('h-auto');
    });

    it('should resolve conflicting display classes', () => {
      const result = cn('block', 'flex', 'inline-block');
      expect(result).toBe('inline-block');
    });

    it('should resolve conflicting position classes', () => {
      const result = cn('relative', 'absolute', 'fixed');
      expect(result).toBe('fixed');
    });

    it('should keep non-conflicting classes from same category', () => {
      const result = cn('px-4', 'py-2'); // Different axes
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
    });

    it('should resolve complex conflicting classes', () => {
      const result = cn(
        'text-sm text-red-500',
        'text-lg text-blue-500'
      );
      expect(result).toBe('text-lg text-blue-500');
    });
  });

  describe('Conditional Classes', () => {
    it('should include class when condition is true', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base active');
    });

    it('should exclude class when condition is false', () => {
      const isActive = false;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base');
    });

    it('should handle multiple conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        'base',
        isActive && 'active',
        isDisabled && 'disabled'
      );
      expect(result).toBe('base active');
    });

    it('should handle ternary operator', () => {
      const variant = 'primary';
      const result = cn(
        'button',
        variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'
      );
      expect(result).toBe('button bg-blue-500');
    });

    it('should handle object syntax with boolean values', () => {
      const result = cn({
        'base': true,
        'active': true,
        'disabled': false,
      });
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).not.toContain('disabled');
    });
  });

  describe('Undefined and Null Handling', () => {
    it('should ignore undefined values', () => {
      const result = cn('class1', undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should ignore null values', () => {
      const result = cn('class1', null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should ignore empty strings', () => {
      const result = cn('class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle all falsy values', () => {
      const result = cn(
        'class1',
        undefined,
        null,
        false,
        0,
        '',
        'class2'
      );
      expect(result).toBe('class1 class2');
    });

    it('should handle optional className prop pattern', () => {
      const className: string | undefined = undefined;
      const result = cn('base', className);
      expect(result).toBe('base');
    });
  });

  describe('Real-World Component Patterns', () => {
    it('should merge base classes with variant classes', () => {
      const baseClasses = 'rounded-md px-4 py-2 font-medium';
      const variantClasses = 'bg-blue-500 text-white hover:bg-blue-600';
      const result = cn(baseClasses, variantClasses);
      
      expect(result).toContain('rounded-md');
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
    });

    it('should handle button component pattern', () => {
      const variant = 'primary';
      const size = 'md';
      const disabled = false;
      
      const result = cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
        },
        {
          'h-10 px-4 py-2': size === 'md',
          'h-9 px-3': size === 'sm',
        },
        disabled && 'opacity-50 cursor-not-allowed'
      );
      
      expect(result).toContain('inline-flex');
      expect(result).toContain('bg-primary');
      expect(result).toContain('h-10');
      expect(result).not.toContain('opacity-50');
    });

    it('should handle input component pattern with error state', () => {
      const hasError = true;
      
      const result = cn(
        'flex h-10 w-full rounded-md border px-3 py-2',
        'border-input bg-background',
        'focus-visible:outline-none focus-visible:ring-2',
        hasError ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-ring'
      );
      
      expect(result).toContain('border-destructive');
      expect(result).toContain('focus-visible:ring-destructive');
      expect(result).not.toContain('focus-visible:ring-ring');
    });

    it('should override base classes with custom className', () => {
      const baseClasses = 'text-sm text-gray-500';
      const customClassName = 'text-lg text-blue-500';
      
      const result = cn(baseClasses, customClassName);
      
      // Custom classes should win
      expect(result).toBe('text-lg text-blue-500');
    });

    it('should handle responsive classes', () => {
      const result = cn(
        'text-sm md:text-base lg:text-lg',
        'p-2 md:p-4 lg:p-6'
      );
      
      expect(result).toContain('text-sm');
      expect(result).toContain('md:text-base');
      expect(result).toContain('lg:text-lg');
      expect(result).toContain('p-2');
      expect(result).toContain('md:p-4');
      expect(result).toContain('lg:p-6');
    });

    it('should handle dark mode variants', () => {
      const result = cn(
        'bg-white text-black',
        'dark:bg-black dark:text-white'
      );
      
      expect(result).toContain('bg-white');
      expect(result).toContain('text-black');
      expect(result).toContain('dark:bg-black');
      expect(result).toContain('dark:text-white');
    });

    it('should handle state variants', () => {
      const result = cn(
        'bg-blue-500',
        'hover:bg-blue-600',
        'focus:ring-2 focus:ring-blue-500',
        'active:bg-blue-700',
        'disabled:opacity-50'
      );
      
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('hover:bg-blue-600');
      expect(result).toContain('focus:ring-2');
      expect(result).toContain('active:bg-blue-700');
      expect(result).toContain('disabled:opacity-50');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long class strings', () => {
      const longClasses = Array.from({ length: 50 }, (_, i) => `class-${i}`).join(' ');
      const result = cn(longClasses);
      expect(result).toBe(longClasses);
    });

    it('should handle duplicate classes', () => {
      const result = cn('class1', 'class2', 'class1');
      // Note: clsx doesn't deduplicate by default, but twMerge handles conflicts
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle classes with special characters', () => {
      const result = cn('w-[123px]', 'h-[calc(100vh-64px)]');
      expect(result).toContain('w-[123px]');
      expect(result).toContain('h-[calc(100vh-64px)]');
    });

    it('should handle arbitrary values in Tailwind', () => {
      const result = cn('bg-[#1da1f2]', 'text-[14px]');
      expect(result).toContain('bg-[#1da1f2]');
      expect(result).toContain('text-[14px]');
    });

    it('should handle conflicting arbitrary values', () => {
      const result = cn('w-[100px]', 'w-[200px]');
      expect(result).toBe('w-[200px]');
    });

    it('should handle nested arrays', () => {
      const result = cn(['class1', ['class2', 'class3']]);
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle whitespace in class strings', () => {
      const result = cn('  class1  ', '  class2  ');
      expect(result).toBe('class1 class2');
    });

    it('should be type-safe with TypeScript', () => {
      // This test verifies TypeScript compilation
      const result: string = cn('class1', 'class2');
      expect(typeof result).toBe('string');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle many arguments efficiently', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...manyClasses);
      expect(typeof result).toBe('string');
      expect(result.split(' ').length).toBeGreaterThan(0);
    });

    it('should handle complex conditional logic', () => {
      const state = {
        isActive: true,
        isDisabled: false,
        isLoading: true,
        variant: 'primary',
        size: 'lg',
      };
      
      const result = cn(
        'base-class',
        state.isActive && 'active',
        state.isDisabled && 'disabled',
        state.isLoading && 'loading',
        state.variant === 'primary' && 'variant-primary',
        state.size === 'lg' && 'size-lg'
      );
      
      expect(result).toContain('base-class');
      expect(result).toContain('active');
      expect(result).toContain('loading');
      expect(result).toContain('variant-primary');
      expect(result).toContain('size-lg');
      expect(result).not.toContain('disabled');
    });
  });
});
