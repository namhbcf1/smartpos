import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  ThemeProvider as MUIThemeProvider,
  createTheme,
  CssBaseline,
  alpha
} from '@mui/material';
import { viVN } from '@mui/material/locale';

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

// Color palettes
const colorPalettes = {
  blue: '#1976d2',
  purple: '#9c27b0',
  green: '#388e3c',
  orange: '#f57c00',
  red: '#d32f2f',
  teal: '#0097a7',
  indigo: '#3f51b5',
  pink: '#e91e63'
};

// Font size configurations
const fontSizes = {
  small: {
    fontSize: 13,
    h1: 2.2,
    h2: 1.8,
    h3: 1.5,
    h4: 1.3,
    h5: 1.1,
    h6: 1.0,
    body1: 0.9,
    body2: 0.8
  },
  medium: {
    fontSize: 14,
    h1: 2.5,
    h2: 2.0,
    h3: 1.7,
    h4: 1.4,
    h5: 1.2,
    h6: 1.1,
    body1: 1.0,
    body2: 0.9
  },
  large: {
    fontSize: 16,
    h1: 2.8,
    h2: 2.2,
    h3: 1.9,
    h4: 1.6,
    h5: 1.4,
    h6: 1.2,
    body1: 1.1,
    body2: 1.0
  }
};

export default function ThemeProvider({ children }: ThemeProviderProps) {
  // Clean up old dark mode settings from localStorage
  useEffect(() => {
    localStorage.removeItem('smartpos-dark-mode');
  }, []);

  const [primaryColor, setPrimaryColorState] = useState(() => {
    return localStorage.getItem('smartpos-primary-color') || colorPalettes.blue;
  });

  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('smartpos-font-size') as 'small' | 'medium' | 'large') || 'medium';
  });

  // Persist theme settings
  useEffect(() => {
    localStorage.setItem('smartpos-primary-color', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('smartpos-font-size', fontSize);
  }, [fontSize]);

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
  };

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
  };

  // Create Material-UI theme - LIGHT MODE ONLY
  const theme = createTheme(
    {
      palette: {
        mode: 'light',
        primary: {
          main: primaryColor,
          light: alpha(primaryColor, 0.7),
           alpha(primaryColor, 1.2),
          contrastText: '#ffffff'
        },
        secondary: {
          main: '#f50057',
          light: '#ff5983',
           '#bb002f',
          contrastText: '#ffffff'
        },
        background: {
          default: '#f8fafc',
          paper: '#ffffff'
        },
        text: {
          primary: '#1e293b',
          secondary: '#64748b'
        },
        success: {
          main: '#10b981',
          light: '#34d399',
           '#059669'
        },
        warning: {
          main: '#f59e0b',
          light: '#fbbf24',
           '#d97706'
        },
        error: {
          main: '#ef4444',
          light: '#f87171',
           '#dc2626'
        },
        info: {
          main: '#3b82f6',
          light: '#60a5fa',
           '#2563eb'
        }
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: fontSizes[fontSize].fontSize,
        h1: {
          fontSize: `${fontSizes[fontSize].h1}rem`,
          fontWeight: 700,
          lineHeight: 1.2
        },
        h2: {
          fontSize: `${fontSizes[fontSize].h2}rem`,
          fontWeight: 600,
          lineHeight: 1.3
        },
        h3: {
          fontSize: `${fontSizes[fontSize].h3}rem`,
          fontWeight: 600,
          lineHeight: 1.4
        },
        h4: {
          fontSize: `${fontSizes[fontSize].h4}rem`,
          fontWeight: 600,
          lineHeight: 1.4
        },
        h5: {
          fontSize: `${fontSizes[fontSize].h5}rem`,
          fontWeight: 500,
          lineHeight: 1.5
        },
        h6: {
          fontSize: `${fontSizes[fontSize].h6}rem`,
          fontWeight: 500,
          lineHeight: 1.5
        },
        body1: {
          fontSize: `${fontSizes[fontSize].body1}rem`,
          lineHeight: 1.6
        },
        body2: {
          fontSize: `${fontSizes[fontSize].body2}rem`,
          lineHeight: 1.6
        },
        button: {
          fontWeight: 500,
          textTransform: 'none'
        }
      },
      shape: {
        borderRadius: 12
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
              '&::-webkit-scrollbar': {
                width: 8
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f5f9'
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#cbd5e1',
                borderRadius: 4,
                '&:hover': {
                  background: '#94a3b8'
                }
              }
            }
          }
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.2s ease-in-out'
            }
          }
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              padding: '8px 20px',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-1px)'
              }
            },
            contained: {
              background: `linear-gradient(135deg, ${primaryColor}, ${alpha(primaryColor, 0.8)})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(primaryColor, 0.9)}, ${alpha(primaryColor, 0.7)})`
              }
            }
          }
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 10,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(primaryColor, 0.5)
                  }
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: primaryColor,
                    borderWidth: 2
                  }
                }
              }
            }
          }
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              fontWeight: 500
            }
          }
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 20,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
            }
          }
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              color: '#1e293b',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
          }
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              borderRight: '1px solid #e2e8f0'
            }
          }
        }
      }
    },
    viVN
  );

  const contextValue: ThemeContextType = {
    primaryColor,
    setPrimaryColor,
    fontSize,
    setFontSize
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}
