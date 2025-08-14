import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface VoiceCommand {
  command: string;
  action: string;
  description: string;
  example: string;
  category: 'product' | 'cart' | 'payment' | 'navigation' | 'customer';
}

interface VoiceResult {
  transcript: string;
  confidence: number;
  action: string;
  parameters?: any;
  success: boolean;
  message: string;
}

const VoiceCommandPOS: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastResult, setLastResult] = useState<VoiceResult | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandHistory, setCommandHistory] = useState<VoiceResult[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Voice commands configuration
  const voiceCommands: VoiceCommand[] = [
    {
      command: 'thêm sản phẩm',
      action: 'ADD_PRODUCT',
      description: 'Thêm sản phẩm vào giỏ hàng',
      example: 'Thêm sản phẩm iPhone 15',
      category: 'product'
    },
    {
      command: 'tìm kiếm',
      action: 'SEARCH_PRODUCT',
      description: 'Tìm kiếm sản phẩm',
      example: 'Tìm kiếm laptop Dell',
      category: 'product'
    },
    {
      command: 'xóa sản phẩm',
      action: 'REMOVE_PRODUCT',
      description: 'Xóa sản phẩm khỏi giỏ hàng',
      example: 'Xóa sản phẩm số 1',
      category: 'cart'
    },
    {
      command: 'thanh toán',
      action: 'PROCESS_PAYMENT',
      description: 'Xử lý thanh toán',
      example: 'Thanh toán bằng tiền mặt',
      category: 'payment'
    },
    {
      command: 'in hóa đơn',
      action: 'PRINT_RECEIPT',
      description: 'In hóa đơn',
      example: 'In hóa đơn cho khách hàng',
      category: 'payment'
    },
    {
      command: 'khách hàng mới',
      action: 'NEW_CUSTOMER',
      description: 'Tạo khách hàng mới',
      example: 'Khách hàng mới tên Nguyễn Văn A',
      category: 'customer'
    },
    {
      command: 'giảm giá',
      action: 'APPLY_DISCOUNT',
      description: 'Áp dụng giảm giá',
      example: 'Giảm giá 10 phần trăm',
      category: 'cart'
    },
    {
      command: 'hủy đơn hàng',
      action: 'CANCEL_ORDER',
      description: 'Hủy đơn hàng hiện tại',
      example: 'Hủy đơn hàng này',
      category: 'cart'
    }
  ];

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      initializeSpeechRecognition();
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN'; // Vietnamese language
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setConfidence(0);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      
      setTranscript(transcript);
      setConfidence(confidence);

      if (result.isFinal) {
        processVoiceCommand(transcript, confidence);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      speak('Xin lỗi, tôi không nghe rõ. Vui lòng thử lại.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text: string) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      synthRef.current.speak(utterance);
    }
  };

  const processVoiceCommand = (transcript: string, confidence: number) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Find matching command
    const matchedCommand = voiceCommands.find(cmd => 
      lowerTranscript.includes(cmd.command.toLowerCase())
    );

    if (matchedCommand && confidence > 0.7) {
      const result: VoiceResult = {
        transcript,
        confidence,
        action: matchedCommand.action,
        success: true,
        message: `Đã thực hiện: ${matchedCommand.description}`
      };

      // Extract parameters based on command type
      switch (matchedCommand.action) {
        case 'ADD_PRODUCT':
          const productName = extractProductName(transcript);
          result.parameters = { productName };
          result.message = `Đang thêm sản phẩm: ${productName}`;
          break;
        
        case 'SEARCH_PRODUCT':
          const searchTerm = extractSearchTerm(transcript);
          result.parameters = { searchTerm };
          result.message = `Đang tìm kiếm: ${searchTerm}`;
          break;
        
        case 'APPLY_DISCOUNT':
          const discount = extractDiscount(transcript);
          result.parameters = { discount };
          result.message = `Áp dụng giảm giá ${discount}%`;
          break;
        
        case 'PROCESS_PAYMENT':
          const paymentMethod = extractPaymentMethod(transcript);
          result.parameters = { paymentMethod };
          result.message = `Thanh toán bằng ${paymentMethod}`;
          break;
        
        default:
          result.message = matchedCommand.description;
      }

      setLastResult(result);
      setCommandHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 commands
      speak(result.message);
      
      // Execute the actual command
      executeCommand(result);
    } else {
      const result: VoiceResult = {
        transcript,
        confidence,
        action: 'UNKNOWN',
        success: false,
        message: confidence < 0.7 ? 'Độ tin cậy thấp, vui lòng nói rõ hơn' : 'Không hiểu lệnh này'
      };
      
      setLastResult(result);
      speak(result.message);
    }
  };

  const extractProductName = (transcript: string): string => {
    const match = transcript.match(/thêm sản phẩm (.+)/i);
    return match ? match[1].trim() : 'sản phẩm';
  };

  const extractSearchTerm = (transcript: string): string => {
    const match = transcript.match(/tìm kiếm (.+)/i);
    return match ? match[1].trim() : '';
  };

  const extractDiscount = (transcript: string): number => {
    const match = transcript.match(/(\d+)\s*(?:phần trăm|%)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const extractPaymentMethod = (transcript: string): string => {
    if (transcript.includes('tiền mặt')) return 'tiền mặt';
    if (transcript.includes('thẻ')) return 'thẻ';
    if (transcript.includes('chuyển khoản')) return 'chuyển khoản';
    return 'tiền mặt';
  };

  const executeCommand = (result: VoiceResult) => {
    // This would integrate with your actual POS system
    console.log('Executing command:', result);
    
    // Example integrations:
    switch (result.action) {
      case 'ADD_PRODUCT':
        // Add product to cart
        console.log('Adding product:', result.parameters?.productName);
        break;
      
      case 'SEARCH_PRODUCT':
        // Trigger product search
        console.log('Searching for:', result.parameters?.searchTerm);
        break;
      
      case 'PROCESS_PAYMENT':
        // Process payment
        console.log('Processing payment:', result.parameters?.paymentMethod);
        break;
      
      // Add more command handlers
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product': return <SearchIcon />;
      case 'cart': return <CartIcon />;
      case 'payment': return <PaymentIcon />;
      case 'customer': return <ReceiptIcon />;
      default: return <MicIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'product': return '#2196F3';
      case 'cart': return '#4CAF50';
      case 'payment': return '#FF9800';
      case 'customer': return '#9C27B0';
      default: return '#666';
    }
  };

  if (!isSupported) {
    return (
      <Alert severity="error">
        Trình duyệt của bạn không hỗ trợ Voice Commands. 
        Vui lòng sử dụng Chrome hoặc Edge.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MicIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Voice Command POS
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={() => setHelpOpen(true)}>
          <HelpIcon />
        </IconButton>
        <IconButton onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
        </IconButton>
      </Box>

      {/* Voice Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Fab
              color={isListening ? 'secondary' : 'primary'}
              size="large"
              onClick={isListening ? stopListening : startListening}
              sx={{ mr: 2 }}
            >
              {isListening ? <MicOffIcon /> : <MicIcon />}
            </Fab>
            <Box>
              <Typography variant="h6">
                {isListening ? 'Đang nghe...' : 'Nhấn để nói'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nói tiếng Việt để điều khiển POS
              </Typography>
            </Box>
          </Box>

          {isListening && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                {transcript || 'Đang chờ giọng nói...'}
              </Typography>
              {confidence > 0 && (
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                  Độ tin cậy: {Math.round(confidence * 100)}%
                </Typography>
              )}
            </Box>
          )}

          {lastResult && (
            <Alert 
              severity={lastResult.success ? 'success' : 'error'}
              icon={lastResult.success ? <CheckIcon /> : <ErrorIcon />}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                <strong>"{lastResult.transcript}"</strong>
              </Typography>
              <Typography variant="body2">
                {lastResult.message}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Lịch sử lệnh
            </Typography>
            <List dense>
              {commandHistory.slice(0, 5).map((cmd, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {cmd.success ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={cmd.transcript}
                    secondary={cmd.message}
                  />
                  <Chip 
                    label={`${Math.round(cmd.confidence * 100)}%`}
                    size="small"
                    color={cmd.confidence > 0.8 ? 'success' : cmd.confidence > 0.6 ? 'warning' : 'error'}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Help Dialog */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Hướng dẫn Voice Commands</Typography>
            <IconButton onClick={() => setHelpOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Bạn có thể sử dụng các lệnh giọng nói sau để điều khiển POS:
          </Typography>
          
          {['product', 'cart', 'payment', 'customer'].map(category => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, color: getCategoryColor(category) }}>
                {category === 'product' && 'Sản phẩm'}
                {category === 'cart' && 'Giỏ hàng'}
                {category === 'payment' && 'Thanh toán'}
                {category === 'customer' && 'Khách hàng'}
              </Typography>
              <List dense>
                {voiceCommands
                  .filter(cmd => cmd.category === category)
                  .map((cmd, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: getCategoryColor(category), width: 32, height: 32 }}>
                          {getCategoryIcon(category)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={cmd.command}
                        secondary={`${cmd.description} - VD: "${cmd.example}"`}
                      />
                    </ListItem>
                  ))}
              </List>
            </Box>
          ))}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cài đặt Voice Commands</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Các tùy chọn cài đặt sẽ được thêm vào phiên bản tiếp theo:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Ngôn ngữ nhận dạng" secondary="Tiếng Việt (mặc định)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Độ nhạy microphone" secondary="Tự động" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Phản hồi bằng giọng nói" secondary="Bật" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VoiceCommandPOS;
