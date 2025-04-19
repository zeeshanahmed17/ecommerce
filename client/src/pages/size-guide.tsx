import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Info,
  Ruler,
  Shirt,
  Footprints,
  MessageSquare,
} from "lucide-react";
import { Link } from "wouter";

// Custom icon for pants
function PantsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h10l-3 17H10L7 3z"></path>
    </svg>
  );
}

// Custom icon for t-shirt
function TShirtIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 4l-2-2H6L4 4l-2 2 3 3h1v11h12V9h1l3-3-2-2z"></path>
    </svg>
  );
}

export default function SizeGuidePage() {
  const [measurementSystem, setMeasurementSystem] = useState("cm");

  const womenSizes = {
    tops: [
      { us: "XXS", uk: "2", eu: "32", bust_cm: "81-82", bust_in: "32", waist_cm: "61-62", waist_in: "24" },
      { us: "XS", uk: "4", eu: "34", bust_cm: "83-84", bust_in: "33", waist_cm: "63-64", waist_in: "25" },
      { us: "S", uk: "6", eu: "36", bust_cm: "85-86", bust_in: "34", waist_cm: "65-66", waist_in: "26" },
      { us: "M", uk: "8", eu: "38", bust_cm: "89-90", bust_in: "35", waist_cm: "69-70", waist_in: "27" },
      { us: "L", uk: "10", eu: "40", bust_cm: "93-94", bust_in: "37", waist_cm: "73-74", waist_in: "29" },
      { us: "XL", uk: "12", eu: "42", bust_cm: "97-98", bust_in: "38", waist_cm: "77-78", waist_in: "30" },
      { us: "XXL", uk: "14", eu: "44", bust_cm: "101-102", bust_in: "40", waist_cm: "81-82", waist_in: "32" }
    ],
    bottoms: [
      { us: "0", uk: "4", eu: "34", waist_cm: "63-64", waist_in: "25", hip_cm: "88-89", hip_in: "35" },
      { us: "2", uk: "6", eu: "36", waist_cm: "66-67", waist_in: "26", hip_cm: "91-92", hip_in: "36" },
      { us: "4", uk: "8", eu: "38", waist_cm: "69-70", waist_in: "27", hip_cm: "94-95", hip_in: "37" },
      { us: "6", uk: "10", eu: "40", waist_cm: "72-73", waist_in: "28", hip_cm: "97-98", hip_in: "38" },
      { us: "8", uk: "12", eu: "42", waist_cm: "75-76", waist_in: "30", hip_cm: "100-101", hip_in: "39" },
      { us: "10", uk: "14", eu: "44", waist_cm: "78-79", waist_in: "31", hip_cm: "103-104", hip_in: "40" },
      { us: "12", uk: "16", eu: "46", waist_cm: "82-83", waist_in: "32", hip_cm: "106-107", hip_in: "42" }
    ],
    shoes: [
      { us: "5", uk: "3", eu: "35", length_cm: "22", length_in: "8.5" },
      { us: "5.5", uk: "3.5", eu: "36", length_cm: "22.5", length_in: "8.75" },
      { us: "6", uk: "4", eu: "37", length_cm: "23", length_in: "9" },
      { us: "6.5", uk: "4.5", eu: "37.5", length_cm: "23.5", length_in: "9.25" },
      { us: "7", uk: "5", eu: "38", length_cm: "24", length_in: "9.5" },
      { us: "7.5", uk: "5.5", eu: "38.5", length_cm: "24.5", length_in: "9.75" },
      { us: "8", uk: "6", eu: "39", length_cm: "25", length_in: "10" },
      { us: "8.5", uk: "6.5", eu: "40", length_cm: "25.5", length_in: "10.25" },
      { us: "9", uk: "7", eu: "41", length_cm: "26", length_in: "10.5" }
    ]
  };

  const menSizes = {
    tops: [
      { us: "XS", uk: "34", eu: "44", chest_cm: "86-88", chest_in: "34-35", waist_cm: "71-76", waist_in: "28-30" },
      { us: "S", uk: "36", eu: "46", chest_cm: "91-93", chest_in: "36-37", waist_cm: "76-81", waist_in: "30-32" },
      { us: "M", uk: "38", eu: "48", chest_cm: "96-98", chest_in: "38-39", waist_cm: "81-86", waist_in: "32-34" },
      { us: "L", uk: "40", eu: "50", chest_cm: "101-103", chest_in: "40-41", waist_cm: "86-91", waist_in: "34-36" },
      { us: "XL", uk: "42", eu: "52", chest_cm: "106-108", chest_in: "42-43", waist_cm: "91-96", waist_in: "36-38" },
      { us: "XXL", uk: "44", eu: "54", chest_cm: "111-113", chest_in: "44-45", waist_cm: "96-101", waist_in: "38-40" }
    ],
    bottoms: [
      { waist_cm: "71-76", waist_in: "28-30", hip_cm: "88-93", hip_in: "34.5-36.5", us: "28-30", eu: "44-46" },
      { waist_cm: "78-83", waist_in: "31-33", hip_cm: "93-98", hip_in: "36.5-38.5", us: "31-33", eu: "48-50" },
      { waist_cm: "86-91", waist_in: "34-36", hip_cm: "98-103", hip_in: "38.5-40.5", us: "34-36", eu: "52-54" },
      { waist_cm: "93-98", waist_in: "37-39", hip_cm: "103-108", hip_in: "40.5-42.5", us: "38-40", eu: "56-58" }
    ],
    shoes: [
      { us: "7", uk: "6", eu: "40", length_cm: "25", length_in: "9.75" },
      { us: "8", uk: "7", eu: "41", length_cm: "26", length_in: "10.25" },
      { us: "9", uk: "8", eu: "42", length_cm: "27", length_in: "10.75" },
      { us: "10", uk: "9", eu: "43", length_cm: "28", length_in: "11" },
      { us: "11", uk: "10", eu: "44", length_cm: "29", length_in: "11.5" },
      { us: "12", uk: "11", eu: "45", length_cm: "30", length_in: "12" },
      { us: "13", uk: "12", eu: "46", length_cm: "31", length_in: "12.5" }
    ]
  };

  const measuringInstructions = [
    {
      part: "Chest/Bust",
      instructions: "Measure around the fullest part of your chest/bust, keeping the measuring tape horizontal.",
      icon: TShirtIcon
    },
    {
      part: "Waist",
      instructions: "Measure around your natural waistline, keeping the tape comfortably loose.",
      icon: Shirt
    },
    {
      part: "Hips",
      instructions: "Measure around the fullest part of your hips, keeping the tape horizontal.",
      icon: PantsIcon
    },
    {
      part: "Inseam",
      instructions: "Measure from the crotch to the bottom of your ankle on the inside of your leg.",
      icon: Ruler
    },
    {
      part: "Foot Length",
      instructions: "Measure from the back of your heel to the tip of your longest toe.",
      icon: Footprints
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Size Guide</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find your perfect fit with our detailed size charts. If you're between sizes, we recommend sizing up for a more comfortable fit.
          </p>
          
          <div className="mt-6 flex justify-center items-center space-x-4">
            <span className="text-sm font-medium">Measurement:</span>
            <Select value={measurementSystem} onValueChange={setMeasurementSystem}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">Centimeters</SelectItem>
                <SelectItem value="in">Inches</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="women" className="mb-12">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="women">Women</TabsTrigger>
            <TabsTrigger value="men">Men</TabsTrigger>
          </TabsList>
          
          <TabsContent value="women">
            <Tabs defaultValue="tops">
              <TabsList className="mb-4">
                <TabsTrigger value="tops">Tops</TabsTrigger>
                <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
                <TabsTrigger value="shoes">Shoes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tops">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>US Size</TableHead>
                        <TableHead>UK Size</TableHead>
                        <TableHead>EU Size</TableHead>
                        <TableHead>Bust ({measurementSystem})</TableHead>
                        <TableHead>Waist ({measurementSystem})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {womenSizes.tops.map((size, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{size.us}</TableCell>
                          <TableCell>{size.uk}</TableCell>
                          <TableCell>{size.eu}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.bust_cm : size.bust_in}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.waist_cm : size.waist_in}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="bottoms">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>US Size</TableHead>
                        <TableHead>UK Size</TableHead>
                        <TableHead>EU Size</TableHead>
                        <TableHead>Waist ({measurementSystem})</TableHead>
                        <TableHead>Hip ({measurementSystem})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {womenSizes.bottoms.map((size, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{size.us}</TableCell>
                          <TableCell>{size.uk}</TableCell>
                          <TableCell>{size.eu}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.waist_cm : size.waist_in}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.hip_cm : size.hip_in}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="shoes">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>US Size</TableHead>
                        <TableHead>UK Size</TableHead>
                        <TableHead>EU Size</TableHead>
                        <TableHead>Foot Length ({measurementSystem})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {womenSizes.shoes.map((size, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{size.us}</TableCell>
                          <TableCell>{size.uk}</TableCell>
                          <TableCell>{size.eu}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.length_cm : size.length_in}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="men">
            <Tabs defaultValue="tops">
              <TabsList className="mb-4">
                <TabsTrigger value="tops">Tops</TabsTrigger>
                <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
                <TabsTrigger value="shoes">Shoes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tops">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>US Size</TableHead>
                        <TableHead>UK Size</TableHead>
                        <TableHead>EU Size</TableHead>
                        <TableHead>Chest ({measurementSystem})</TableHead>
                        <TableHead>Waist ({measurementSystem})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menSizes.tops.map((size, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{size.us}</TableCell>
                          <TableCell>{size.uk}</TableCell>
                          <TableCell>{size.eu}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.chest_cm : size.chest_in}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.waist_cm : size.waist_in}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="bottoms">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>US Size</TableHead>
                        <TableHead>EU Size</TableHead>
                        <TableHead>Waist ({measurementSystem})</TableHead>
                        <TableHead>Hip ({measurementSystem})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menSizes.bottoms.map((size, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{size.us}</TableCell>
                          <TableCell>{size.eu}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.waist_cm : size.waist_in}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.hip_cm : size.hip_in}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="shoes">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>US Size</TableHead>
                        <TableHead>UK Size</TableHead>
                        <TableHead>EU Size</TableHead>
                        <TableHead>Foot Length ({measurementSystem})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menSizes.shoes.map((size, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{size.us}</TableCell>
                          <TableCell>{size.uk}</TableCell>
                          <TableCell>{size.eu}</TableCell>
                          <TableCell>{measurementSystem === "cm" ? size.length_cm : size.length_in}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
        
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <Ruler className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-xl font-semibold">How to Measure</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {measuringInstructions.map((item, index) => (
              <div key={index} className="flex p-4 border rounded-md">
                <div className="mr-4 bg-primary/10 p-2 rounded-full h-10 w-10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{item.part}</h3>
                  <p className="text-sm text-gray-600">{item.instructions}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-start mb-4 md:mb-0">
            <Info className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Still not sure about your size?</h3>
              <p className="text-sm text-gray-600">Our customer service team is happy to help you find the perfect fit.</p>
            </div>
          </div>
          <Link href="/contact">
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 