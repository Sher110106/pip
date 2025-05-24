# Component Documentation

This document provides comprehensive documentation for all React components in the Python Dependency Resolver application.

## 🎯 Component Architecture

The application follows a modular component architecture with the following principles:

- **Reusable UI Components**: Generic, composable components in `src/components/`
- **Feature Components**: Page-specific components in `src/components/home/`
- **Type Safety**: All components are fully typed with TypeScript
- **Accessibility**: Components follow WAI-ARIA guidelines
- **Responsive Design**: Mobile-first responsive approach

## 📁 Component Structure

```
src/components/
├── home/                      # Landing page sections
│   ├── hero-section.tsx
│   ├── benefits-section.tsx
│   ├── live-demo-section.tsx
│   ├── github-integration-section.tsx
│   └── snake-animation.tsx
├── ui/                        # Reusable UI components
│   ├── avatar/
│   ├── button/
│   ├── card/
│   ├── dropdown/
│   ├── input/
│   ├── label/
│   ├── loader/
│   ├── menu-bar/
│   ├── modal/
│   ├── select/
│   ├── slot/
│   ├── textarea/
│   ├── toggle/
│   └── tooltip/
├── tool-invocation-card/      # AI tool execution display
└── memoized-markdown.tsx      # Optimized markdown renderer
```

## 🏠 Home Page Components

### HeroSection

The main landing section with introduction and primary CTA.

**Location**: `src/components/home/hero-section.tsx`

```typescript
interface HeroSectionProps {
  onGetStarted?: () => void;
  className?: string;
}

export function HeroSection({ onGetStarted, className }: HeroSectionProps)
```

**Features:**
- Animated title with typing effect
- Primary and secondary CTAs
- Feature highlights
- Responsive layout

**Usage:**
```tsx
<HeroSection onGetStarted={() => scrollToDemo()} />
```

### BenefitsSection

Showcases key benefits and features of the system.

**Location**: `src/components/home/benefits-section.tsx`

```typescript
interface BenefitsSectionProps {
  className?: string;
}

export function BenefitsSection({ className }: BenefitsSectionProps)
```

**Features:**
- Icon-based benefit cards
- Animated counters
- Feature comparison table
- Performance metrics

**Benefits Displayed:**
- AI-Powered Analysis
- Deprecation Detection
- Conflict Resolution
- GitHub Integration
- Security Scanning
- Performance Optimization

### LiveDemoSection

Interactive demo interface for testing dependency resolution.

**Location**: `src/components/home/live-demo-section.tsx`

```typescript
interface LiveDemoSectionProps {
  className?: string;
}

export function LiveDemoSection({ className }: LiveDemoSectionProps)
```

**Features:**
- Real-time dependency resolution
- Multiple input formats support
- Results visualization with tabs
- Copy-to-clipboard functionality
- Error handling and validation

**Demo Tabs:**
1. **Overview**: Summary and quick stats
2. **Requirements.txt**: Generated requirements file
3. **Detailed Report**: Full analysis markdown

### GitHubIntegrationSection

Explains and demonstrates GitHub App integration.

**Location**: `src/components/home/github-integration-section.tsx`

```typescript
interface GitHubIntegrationSectionProps {
  className?: string;
}

export function GitHubIntegrationSection({ className }: GitHubIntegrationSectionProps)
```

**Features:**
- GitHub App installation flow
- PR analysis demonstration
- Setup instructions
- Integration benefits

### SnakeAnimation

Animated background element with Python-themed graphics.

**Location**: `src/components/home/snake-animation.tsx`

```typescript
interface SnakeAnimationProps {
  className?: string;
  isVisible?: boolean;
}

export function SnakeAnimation({ className, isVisible = true }: SnakeAnimationProps)
```

**Features:**
- GSAP-powered animations
- Performance optimized
- Responsive scaling
- Intersection Observer integration

## 🎨 UI Components

### Button

Versatile button component with multiple variants.

**Location**: `src/components/button/button.tsx`

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export function Button({ variant = 'default', size = 'default', asChild = false, className, ...props }: ButtonProps)
```

**Variants:**
- `default`: Primary blue button
- `destructive`: Red warning/error button
- `outline`: Bordered button with transparent background
- `secondary`: Gray secondary button
- `ghost`: Minimal button without background
- `link`: Text-only link button

**Sizes:**
- `default`: Standard button size
- `sm`: Small button
- `lg`: Large button
- `icon`: Square button for icons

**Usage:**
```tsx
<Button variant="default" size="lg" onClick={handleClick}>
  Get Started
</Button>

<Button variant="outline" size="sm" asChild>
  <Link to="/docs">Documentation</Link>
</Button>
```

### Card

Container component for grouping related content.

**Location**: `src/components/card/card.tsx`

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps)
export function CardHeader({ className, ...props }: CardHeaderProps)
export function CardTitle({ className, ...props }: CardTitleProps)
export function CardDescription({ className, ...props }: CardDescriptionProps)
export function CardContent({ className, ...props }: CardContentProps)
export function CardFooter({ className, ...props }: CardFooterProps)
```

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Package Analysis</CardTitle>
    <CardDescription>Detailed information about resolved packages</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Input

Enhanced input component with validation support.

**Location**: `src/components/input/input.tsx`

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  description?: string;
}

export function Input({ className, type, error, label, description, ...props }: InputProps)
```

**Features:**
- Built-in error state styling
- Optional label and description
- Accessible with proper ARIA attributes
- Support for all HTML input types

**Usage:**
```tsx
<Input
  label="Python Version"
  description="Select target Python version (3.8-3.12)"
  placeholder="3.9"
  error={validationError}
  onChange={handleVersionChange}
/>
```

### Textarea

Multi-line text input for requirements and descriptions.

**Location**: `src/components/textarea/textarea.tsx`

```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  description?: string;
}

export function Textarea({ className, error, label, description, ...props }: TextareaProps)
```

**Usage:**
```tsx
<Textarea
  label="Requirements"
  description="Enter your Python requirements, one per line"
  placeholder="numpy>=1.19.0&#10;pandas>=1.3.0&#10;requests"
  rows={8}
  value={requirements}
  onChange={handleRequirementsChange}
/>
```

### Select

Dropdown selection component with search support.

**Location**: `src/components/select/select.tsx`

```typescript
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Select({ value, onValueChange, placeholder, children, disabled }: SelectProps)
export function SelectItem({ value, children, disabled }: SelectItemProps)
```

**Usage:**
```tsx
<Select value={pythonVersion} onValueChange={setPythonVersion} placeholder="Select Python version">
  <SelectItem value="3.8">Python 3.8</SelectItem>
  <SelectItem value="3.9">Python 3.9</SelectItem>
  <SelectItem value="3.10">Python 3.10</SelectItem>
  <SelectItem value="3.11">Python 3.11</SelectItem>
  <SelectItem value="3.12">Python 3.12</SelectItem>
</Select>
```

### Toggle

Switch component for boolean settings.

**Location**: `src/components/toggle/toggle.tsx`

```typescript
interface ToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function Toggle({ checked, onCheckedChange, disabled, label, description }: ToggleProps)
```

**Usage:**
```tsx
<Toggle
  checked={allowPrereleases}
  onCheckedChange={setAllowPrereleases}
  label="Allow Pre-releases"
  description="Include alpha, beta, and RC versions in resolution"
/>
```

### Loader

Loading indicator with multiple variants.

**Location**: `src/components/loader/loader.tsx`

```typescript
interface LoaderProps {
  variant?: 'default' | 'dots' | 'spinner' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loader({ variant = 'default', size = 'md', className }: LoaderProps)
```

**Variants:**
- `default`: Classic spinning circle
- `dots`: Three bouncing dots
- `spinner`: Material Design spinner
- `pulse`: Pulsing circle

**Usage:**
```tsx
<Loader variant="dots" size="lg" />
```

### Modal

Accessible modal dialog component.

**Location**: `src/components/modal/modal.tsx`

```typescript
interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface ModalContentProps {
  className?: string;
  children: React.ReactNode;
}

export function Modal({ open, onOpenChange, children }: ModalProps)
export function ModalContent({ className, children }: ModalContentProps)
export function ModalHeader({ className, children }: ModalHeaderProps)
export function ModalTitle({ className, children }: ModalTitleProps)
export function ModalDescription({ className, children }: ModalDescriptionProps)
export function ModalFooter({ className, children }: ModalFooterProps)
```

**Usage:**
```tsx
<Modal open={showDetails} onOpenChange={setShowDetails}>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Package Details</ModalTitle>
      <ModalDescription>Detailed analysis for {packageName}</ModalDescription>
    </ModalHeader>
    {/* Modal content */}
    <ModalFooter>
      <Button variant="outline" onClick={() => setShowDetails(false)}>
        Close
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

### Tooltip

Contextual help and information display.

**Location**: `src/components/tooltip/tooltip.tsx`

```typescript
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
}

export function Tooltip({ content, children, side = 'top', align = 'center', delayDuration = 200 }: TooltipProps)
```

**Usage:**
```tsx
<Tooltip content="This option includes alpha and beta versions in the resolution process">
  <Button variant="ghost" size="icon">
    <InfoIcon />
  </Button>
</Tooltip>
```

### Avatar

User profile image component with fallback.

**Location**: `src/components/avatar/avatar.tsx`

```typescript
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps)
```

**Usage:**
```tsx
<Avatar
  src="https://github.com/username.png"
  alt="User Name"
  fallback="UN"
  size="lg"
/>
```

### Dropdown

Contextual menu component.

**Location**: `src/components/dropdown/dropdown.tsx`

```typescript
interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function Dropdown({ trigger, children, align = 'center', side = 'bottom' }: DropdownProps)
export function DropdownItem({ children, onClick, disabled }: DropdownItemProps)
export function DropdownSeparator()
```

**Usage:**
```tsx
<Dropdown
  trigger={<Button variant="outline">Options</Button>}
  align="end"
>
  <DropdownItem onClick={handleExport}>Export Report</DropdownItem>
  <DropdownItem onClick={handleShare}>Share Results</DropdownItem>
  <DropdownSeparator />
  <DropdownItem onClick={handleReset} disabled={isLoading}>Reset</DropdownItem>
</Dropdown>
```

## 🔧 Specialized Components

### ToolInvocationCard

Displays AI tool execution with real-time progress.

**Location**: `src/components/tool-invocation-card/tool-invocation-card.tsx`

```typescript
interface ToolInvocationCardProps {
  invocation: {
    toolName: string;
    args: Record<string, any>;
    result?: any;
    state: 'calling' | 'result' | 'error';
  };
  className?: string;
}

export function ToolInvocationCard({ invocation, className }: ToolInvocationCardProps)
```

**Features:**
- Real-time execution status
- Formatted argument display
- Result visualization
- Error handling
- Expandable details

**Usage:**
```tsx
<ToolInvocationCard
  invocation={{
    toolName: 'searchPackageInfo',
    args: { packageName: 'numpy', includeDeprecation: true },
    result: packageInfo,
    state: 'result'
  }}
/>
```

### MemoizedMarkdown

Optimized markdown renderer with syntax highlighting.

**Location**: `src/components/memoized-markdown.tsx`

```typescript
interface MemoizedMarkdownProps {
  content: string;
  className?: string;
  components?: Record<string, React.ComponentType<any>>;
}

export function MemoizedMarkdown({ content, className, components }: MemoizedMarkdownProps)
```

**Features:**
- React.memo optimization
- GitHub Flavored Markdown support
- Syntax highlighting for code blocks
- Custom component overrides
- Link safety (nofollow, noopener)

**Usage:**
```tsx
<MemoizedMarkdown
  content={detailedReport}
  className="prose prose-slate max-w-none"
  components={{
    code: ({ className, children, ...props }) => (
      <code className={cn("bg-slate-100 px-1 py-0.5 rounded", className)} {...props}>
        {children}
      </code>
    )
  }}
/>
```

### MenuBar

Application navigation and actions.

**Location**: `src/components/menu-bar/menu-bar.tsx`

```typescript
interface MenuBarProps {
  className?: string;
}

export function MenuBar({ className }: MenuBarProps)
```

**Features:**
- Responsive navigation
- Theme toggle
- User menu (when authenticated)
- Quick actions
- Mobile-friendly hamburger menu

## 🎨 Styling and Theming

### CSS Variables

The application uses CSS custom properties for consistent theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

### Component Variants

Components use `class-variance-authority` for consistent variant management:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## 🔍 Component Testing

### Testing Guidelines

1. **Unit Tests**: Test component logic and rendering
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Verify ARIA compliance
4. **Visual Tests**: Snapshot testing for UI consistency

### Example Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });
});
```

## 📱 Responsive Design

### Breakpoints

The application uses Tailwind's default breakpoints:

- `sm`: 640px and up
- `md`: 768px and up  
- `lg`: 1024px and up
- `xl`: 1280px and up
- `2xl`: 1536px and up

### Mobile-First Approach

Components are designed mobile-first with progressive enhancement:

```tsx
<div className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">
  <Card className="w-full md:w-1/2 lg:w-1/3">
    {/* Card content */}
  </Card>
</div>
```

## ♿ Accessibility

### ARIA Support

All interactive components include proper ARIA attributes:

```tsx
<button
  type="button"
  aria-expanded={isOpen}
  aria-haspopup="true"
  aria-controls="dropdown-menu"
  onClick={handleToggle}
>
  Options
</button>
```

### Keyboard Navigation

Components support full keyboard navigation:

- Tab/Shift+Tab for focus management
- Enter/Space for activation
- Escape for dismissal
- Arrow keys for navigation

### Screen Reader Support

- Semantic HTML elements
- Descriptive labels and descriptions
- Live regions for dynamic content
- Proper heading hierarchy

## 🚀 Performance Optimization

### React.memo

Expensive components are memoized:

```typescript
export const MemoizedMarkdown = React.memo(function MemoizedMarkdown({
  content,
  className,
  components
}: MemoizedMarkdownProps) {
  // Component implementation
});
```

### Lazy Loading

Large components are lazy-loaded:

```typescript
const LiveDemoSection = lazy(() => import('./live-demo-section'));

// Usage with Suspense
<Suspense fallback={<Loader variant="dots" size="lg" />}>
  <LiveDemoSection />
</Suspense>
```

### Bundle Optimization

- Tree shaking for unused code
- Code splitting by route
- Dynamic imports for heavy dependencies
- Image optimization with proper formats

---

For implementation details and examples, see the [Development Guide](./DEVELOPMENT.md) and component source files in `src/components/`. 